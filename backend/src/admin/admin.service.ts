import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { ProductDto, PublicationDto } from './product.dto';
import { productNameFilter } from '../database/product-search';

const include = { category: true, variants: { orderBy: [{ size: 'asc' as const }, { color: 'asc' as const }] }, photos: { orderBy: { position: 'asc' as const } } };
const normalized = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
type Transaction = Prisma.TransactionClient;

@Injectable()
export class AdminService {
  constructor(private readonly db: PrismaService) {}
  async list(q?: string) {
    return this.db.product.findMany({ where: { deletedAt: null, ...await productNameFilter(this.db, q) }, include, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }] });
  }
  async detail(id: string) {
    const product = await this.db.product.findUnique({ where: { id }, include });
    if (!product || product.deletedAt) throw new NotFoundException('Modelo no encontrado.');
    return product;
  }
  categories() { return this.db.category.findMany({ orderBy: { name: 'asc' } }); }
  async createCategory(name: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`category:${normalized(name)}`}))`;
      const existing = await tx.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
      if (existing) return existing;
      return tx.category.create({ data: { id: randomUUID(), name } });
    });
  }
  private async validate(tx: Transaction, dto: ProductDto, id?: string) {
    if (new Prisma.Decimal(dto.price).lte(0)) throw new BadRequestException('El precio debe ser mayor que cero.');
    if (!await tx.category.findUnique({ where: { id: dto.categoryId } })) throw new BadRequestException('Selecciona una categoría existente.');
    const keys = dto.variants.map(v => `${v.size}:${normalized(v.color)}`);
    if (new Set(keys).size !== keys.length) throw new BadRequestException('Hay combinaciones de talla y color duplicadas.');
    for (const rows of [dto.variants, dto.photos]) {
      const ids = rows.map(row => row.id).filter(Boolean);
      if (new Set(ids).size !== ids.length) throw new BadRequestException('No se puede repetir el mismo registro.');
    }
    const assets = dto.photos.map(p => p.assetId).filter(Boolean);
    if (new Set(assets).size !== assets.length) throw new BadRequestException('Una fotografía no puede repetirse en la galería.');
    // Serialize writes for the same normalized name, including simultaneous creation.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`product:${normalized(dto.name)}`}))`;
    const duplicate = await tx.product.findFirst({ where: { name: { equals: dto.name, mode: 'insensitive' }, ...(id ? { id: { not: id } } : {}) } });
    if (duplicate) throw new ConflictException('Ya existe un modelo con ese nombre. Edítalo desde el listado.');
  }
  private async save(tx: Transaction, dto: ProductDto, id?: string) {
    await this.validate(tx, dto, id);
    const existing = id ? await tx.product.findUnique({ where: { id }, include }) : null;
    if (id && (!existing || existing.deletedAt)) throw new NotFoundException('Modelo no encontrado.');
    if (existing && dto.version === undefined) throw new BadRequestException('Falta la versión del modelo. Vuelve a abrir el formulario.');
    const data = {
      name: dto.name, description: dto.description, material: dto.material, categoryId: dto.categoryId, price: dto.price, published: dto.published, demo: dto.demo,
      // Missing fields preserve existing values; empty strings explicitly clear them.
      sole: dto.sole === undefined ? undefined : dto.sole || null,
      insole: dto.insole === undefined ? undefined : dto.insole || null,
      lining: dto.lining === undefined ? undefined : dto.lining || null,
      details: dto.details === undefined ? undefined : dto.details || null,
    };
    let productId: string;
    if (existing) {
      const updated = await tx.product.updateMany({ where: { id: existing.id, version: dto.version, deletedAt: null }, data: { ...data, version: { increment: 1 } } });
      if (!updated.count) throw new ConflictException('Otro administrador modificó el modelo. Recarga antes de guardar.');
      productId = existing.id;
    } else {
      const suffix = randomUUID();
      const slugBase = dto.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'modelo';
      const product = await tx.product.create({ data: { ...data, id: suffix, slug: `${slugBase}-${suffix.slice(0, 8)}` } });
      productId = product.id;
    }
    const originalVariants = existing?.variants || [];
    const originalPhotos = existing?.photos || [];
    if (dto.variants.some(v => v.id && !originalVariants.some(old => old.id === v.id)) || dto.photos.some(p => p.id && !originalPhotos.some(old => old.id === p.id))) {
      throw new BadRequestException('Una variante o fotografía no pertenece a este producto.');
    }
    const keepVariants = dto.variants.flatMap(v => v.id ? [v.id] : []);
    await tx.variant.deleteMany({ where: { productId, id: { notIn: keepVariants } } });
    // Temporary unique colors allow swapping two existing combinations without replacing IDs.
    for (const variant of dto.variants) if (variant.id) {
      await tx.variant.update({ where: { id: variant.id }, data: { color: `__edit_${variant.id}` } });
    }
    for (const variant of dto.variants) {
      const lowerColor = normalized(variant.color);
      const color = lowerColor.charAt(0).toUpperCase() + lowerColor.slice(1);
      const availabilityConfirmed = variant.availabilityConfirmed ?? (variant.available ? true : originalVariants.find(v => v.id === variant.id)?.availabilityConfirmed ?? true);
      if (variant.available && !availabilityConfirmed) throw new BadRequestException('Confirma la disponibilidad antes de marcar una combinacion disponible.');
      const variantData = { size: variant.size, color, available: variant.available, availabilityConfirmed };
      if (variant.id) await tx.variant.update({ where: { id: variant.id }, data: variantData });
      else await tx.variant.create({ data: { ...variantData, productId } });
    }
    const keepPhotos = dto.photos.flatMap(p => p.id ? [p.id] : []);
    await tx.photo.deleteMany({ where: { productId, id: { notIn: keepPhotos } } });
    const offset = Math.max(0, ...originalPhotos.map(p => p.position)) + dto.photos.length + 1;
    await tx.photo.updateMany({ where: { productId }, data: { position: { increment: offset } } });
    for (const [position, photo] of dto.photos.entries()) {
      const old = originalPhotos.find(p => p.id === photo.id);
      if (old && photo.assetId && photo.assetId !== old.assetId) throw new BadRequestException('Para sustituir una foto, añade el archivo nuevo y retira la anterior.');
      if (old) await tx.photo.update({ where: { id: old.id }, data: { position, alt: photo.alt, color: photo.color === undefined ? undefined : photo.color || null } });
      else {
        const asset = photo.assetId ? await tx.mediaAsset.findUnique({ where: { id: photo.assetId } }) : null;
        if (!asset) throw new BadRequestException('Carga las fotografías antes de guardar.');
        await tx.photo.create({ data: { productId, assetId: asset.id, url: `/api/media/${asset.id}`, alt: photo.alt, position, color: photo.color || null } });
      }
    }
    return tx.product.findUniqueOrThrow({ where: { id: productId }, include });
  }
  private async transaction(dto: ProductDto, id?: string) {
    try { return await this.db.$transaction(tx => this.save(tx, dto, id), { timeout: 20000 }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) throw new ConflictException('Los datos entran en conflicto con otro registro. Recarga y revisa el formulario.');
      throw error;
    }
  }
  create(dto: ProductDto) { return this.transaction(dto); }
  update(id: string, dto: ProductDto) { return this.transaction(dto, id); }
  async remove(id: string, version: number) {
    const result = await this.db.product.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), published: false, version: { increment: 1 } } });
    if (!result.count) throw new ConflictException('El producto cambio o ya fue eliminado. Recarga el listado.');
    return { message: 'Producto eliminado del catalogo. Su historial se conserva.' };
  }
  async publish(id: string, dto: PublicationDto) {
    return this.db.$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id }, include });
      if (!product || product.deletedAt) throw new NotFoundException('Modelo no encontrado.');
      if (dto.published && (!product.photos.some(p => p.position === 0) || !product.variants.length || !product.description.trim() || !product.material.trim() || product.price.lte(0))) {
        throw new BadRequestException('Completa los datos, las variantes y la fotografía principal antes de publicar.');
      }
      const updated = await tx.product.updateMany({ where: { id, version: dto.version, deletedAt: null }, data: { published: dto.published, version: { increment: 1 } } });
      if (!updated.count) throw new ConflictException('El modelo cambió. Recarga antes de cambiar su publicación.');
      return tx.product.findUniqueOrThrow({ where: { id }, include });
    });
  }
}
