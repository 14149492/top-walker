import { BadRequestException, HttpException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { EventDto, StatsQueryDto } from './analytics.dto';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly salt = randomBytes(32);
  private timer?: ReturnType<typeof setInterval>;
  constructor(private readonly db: PrismaService) {}
  onModuleInit() {
    this.timer = setInterval(() => { void this.cleanup().catch(() => undefined); }, 60 * 60 * 1000);
    this.timer.unref();
    void this.cleanup().catch(() => undefined);
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async cleanup() {
    await this.db.eventGate.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.db.catalogEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 365 * 86400000) } } });
  }
  async record(dto: EventDto, ip: string) {
    const now = new Date();
    // Never trust browser-supplied forwarded IP headers. Limit ingress and anonymous session separately.
    const ingressKey = 'ip:' + createHmac('sha256', this.salt).update(ip).digest('hex');
    const visitorKey = 'visitor:' + createHash('sha256').update(dto.visitorId).digest('hex');
    const limited = await this.db.$transaction(async tx => {
      let exceeded = false;
      for (const [key, limit] of [[ingressKey, 600], [visitorKey, 60]] as const) {
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${key}))`;
        const old = await tx.eventGate.findUnique({ where: { key } });
        const fresh = !old || old.expiresAt <= now;
        const count = fresh ? 1 : old.count + 1;
        await tx.eventGate.upsert({ where: { key }, create: { key, count, expiresAt: new Date(+now + 60000) }, update: { count, ...(fresh ? { expiresAt: new Date(+now + 60000) } : {}) } });
        exceeded ||= count > limit;
      }
      return exceeded;
    });
    if (limited) throw new HttpException('Demasiadas solicitudes. Intenta mas tarde.', 429);
    const product = await this.db.product.findFirst({ where: { id: dto.productId, published: true, deletedAt: null }, include: { variants: true } });
    if (!product) throw new NotFoundException('Producto no disponible.');
    if (dto.type === 'PRODUCT_VIEW' && (dto.size !== undefined || dto.color !== undefined)) throw new BadRequestException('Una vista no contiene seleccion.');
    if (dto.type === 'COLOR_SELECT' && (!dto.color || dto.size !== undefined)) throw new BadRequestException('Seleccion de color incorrecta.');
    if (dto.type === 'SIZE_SELECT' && (!dto.color || dto.size === undefined)) throw new BadRequestException('Selecciona color y talla.');
    if (dto.size !== undefined && !dto.color) throw new BadRequestException('La talla requiere un color.');
    if (dto.color && !product.variants.some(v => v.color === dto.color && (dto.size === undefined || v.size === dto.size))) throw new BadRequestException('Combinacion inexistente.');
    const key = 'event:' + createHash('sha256').update(JSON.stringify([dto.visitorId, dto.productId, dto.type, dto.size ?? null, dto.color ?? null])).digest('hex');
    try {
      return await this.db.$transaction(async tx => {
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${key}))`;
        if (await tx.catalogEvent.findUnique({ where: { id: dto.id } })) return { recorded: false };
        const gate = await tx.eventGate.findUnique({ where: { key } });
        if (gate && gate.expiresAt > now) return { recorded: false };
        const expiresAt = new Date(+now + (dto.type === 'PRODUCT_VIEW' ? 300000 : 30000));
        await tx.eventGate.upsert({ where: { key }, create: { key, expiresAt }, update: { expiresAt } });
        await tx.catalogEvent.create({ data: { id: dto.id, type: dto.type, productId: dto.productId, size: dto.size, color: dto.color } });
        return { recorded: true };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { recorded: false };
      throw error;
    }
  }
  async summary(query: StatsQueryDto) {
    const today = new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10);
    const to = query.to || today;
    const end = new Date(to + 'T00:00:00-04:00');
    const start = query.from ? new Date(query.from + 'T00:00:00-04:00') : new Date(+end - (Number(query.days || 30) - 1) * 86400000);
    const validDay = (value: string) => new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
    if (!Number.isFinite(+start) || !Number.isFinite(+end) || !validDay(to) || (query.from && !validDay(query.from)) || +start > +end || +end - +start > 365 * 86400000) throw new BadRequestException('Usa un rango valido de hasta 366 dias.');
    const until = new Date(+end + 86400000);
    const where = { createdAt: { gte: start, lt: until }, product: { demo: false } };
    const groups = await this.db.catalogEvent.groupBy({ by: ['productId', 'type', 'size', 'color'], where, _count: { _all: true } });
    const records = await this.db.product.findMany({ where: { id: { in: [...new Set(groups.map(g => g.productId))] } }, select: { id: true, name: true, deletedAt: true, photos: { orderBy: { position: 'asc' }, take: 1, select: { url: true, alt: true, position: true } } } });
    const products = records.map(({ photos, ...product }) => ({ ...product, photo: photos[0] ?? null }));
    const productsById = new Map(products.map(product => [product.id, product]));
    const ranking = products.map(p => {
      const count = (type: string) => groups.filter(g => g.productId === p.id && g.type === type).reduce((n, g) => n + g._count._all, 0);
      const views = count('PRODUCT_VIEW'), clicks = count('WHATSAPP_CLICK');
      return { ...p, views, clicks, rate: views ? Math.round(clicks / views * 1000) / 10 : null };
    });
    const sum = (type: string) => groups.filter(g => g.type === type).reduce((n, g) => n + g._count._all, 0);
    const dimensions = (kind: 'size' | 'color') => {
      const map = new Map<string, { productId: string; name: string; photo: typeof products[number]['photo']; value: string; selections: number; clicks: number }>();
      for (const g of groups) {
        if (g[kind] === null || ![kind === 'size' ? 'SIZE_SELECT' : 'COLOR_SELECT', 'WHATSAPP_CLICK'].includes(g.type)) continue;
        const key = `${g.productId}:${g[kind]}`;
        const product = productsById.get(g.productId)!;
        const row = map.get(key) || { productId: g.productId, name: product.name, photo: product.photo, value: String(g[kind]), selections: 0, clicks: 0 };
        if (g.type === 'WHATSAPP_CLICK') row.clicks += g._count._all; else row.selections += g._count._all;
        map.set(key, row);
      }
      return [...map.values()].sort((a, b) => b.selections - a.selections || b.clicks - a.clicks);
    };
    const daily = await this.db.$queryRaw<{ date: string; views: number; clicks: number }[]>`
      SELECT to_char(e."createdAt" - interval '4 hours', 'YYYY-MM-DD') AS date,
        count(*) FILTER (WHERE e.type = 'PRODUCT_VIEW')::int AS views,
        count(*) FILTER (WHERE e.type = 'WHATSAPP_CLICK')::int AS clicks
      FROM "CatalogEvent" e JOIN "Product" p ON p.id = e."productId"
      WHERE e."createdAt" >= ${start} AND e."createdAt" < ${until} AND NOT p.demo
      GROUP BY date ORDER BY date`;
    return {
      from: new Date(+start - 4 * 3600000).toISOString().slice(0, 10), to,
      totals: { views: sum('PRODUCT_VIEW'), clicks: sum('WHATSAPP_CLICK'), sizeSelections: sum('SIZE_SELECT'), colorSelections: sum('COLOR_SELECT') },
      byViews: [...ranking].sort((a, b) => b.views - a.views), byClicks: [...ranking].sort((a, b) => b.clicks - a.clicks),
      sizes: dimensions('size'), colors: dimensions('color'), daily,
      variants: groups.filter(g => g.type === 'WHATSAPP_CLICK' && g.size !== null && g.color !== null).map(g => ({ productId: g.productId, name: productsById.get(g.productId)!.name, photo: productsById.get(g.productId)!.photo, size: g.size, color: g.color, clicks: g._count._all })).sort((a, b) => b.clicks - a.clicks),
    };
  }
}
