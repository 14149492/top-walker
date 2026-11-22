import 'reflect-metadata';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
const { AppModule } = require('../dist/app.module');
import type { PrismaService } from '../src/database/prisma.service';
import type { MediaService } from '../src/media/media.service';

type Model = { key: string; name: string; category: string; description: string; material: string; price: string; sole: string; insole: string; lining: string; details: string; announcedSizes: number[]; photos: { file: string; sha256: string; color: string; alt: string }[] };
async function main() {
  const directory = resolve('catalog');
  const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8')) as { version: number; products: Model[] };
  if (manifest.version !== 1 || !manifest.products.length) throw new Error('Manifest version not supported');
  const keys = new Set<string>();
  for (const model of manifest.products) {
    if (!/^[a-z0-9-]+$/.test(model.key) || keys.has(model.key) || !model.photos.length || !model.announcedSizes.length || Number(model.price) <= 0) throw new Error('Invalid or duplicated model');
    keys.add(model.key);
    for (const photo of model.photos) {
      const path = resolve(directory, 'photos', photo.file);
      if (!path.startsWith(resolve(directory, 'photos') + sep) || (await stat(path)).size > 5 * 1024 * 1024) throw new Error('Invalid photo path/size');
      if (createHash('sha256').update(await readFile(path)).digest('hex') !== photo.sha256) throw new Error('Photo checksum mismatch: ' + photo.file);
    }
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const db = app.get<PrismaService>(require('../dist/database/prisma.service').PrismaService), media = app.get<MediaService>(require('../dist/media/media.service').MediaService);
  try {
    const update = process.argv.includes('--update');
    let created = 0, updated = 0, skipped = 0;
    for (const model of manifest.products) {
      const importKey = 'zapatos1:' + model.key;
      const old = await db.product.findUnique({ where: { importKey } });
      if (old && (!update || old.deletedAt)) { skipped++; continue; }
      const duplicate = await db.product.findFirst({ where: { name: { equals: model.name, mode: 'insensitive' }, OR: [{ importKey: null }, { importKey: { not: importKey } }] } });
      if (duplicate) throw new Error(`Existe un modelo con el nombre ${model.name}; revisar antes de importar.`);
      const assets = [];
      for (const photo of model.photos) {
        const buffer = await readFile(resolve(directory, 'photos', photo.file));
        assets.push(await media.upload({ buffer, mimetype: 'image/webp' } as Express.Multer.File, 'import-' + photo.sha256));
      }
      await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${importKey}))`;
        const current = await tx.product.findUnique({ where: { importKey } });
        if (current && (!update || current.deletedAt)) return;
        const categoryName = { botines: 'Botines', oxford: 'Oxford', derby: 'Derby' }[model.category] || model.category;
        const category = await tx.category.upsert({ where: { name: categoryName }, update: {}, create: { id: model.category, name: categoryName } });
        const data = { name: model.name, description: model.description, material: model.material, price: model.price, sole: model.sole, insole: model.insole, lining: model.lining, details: model.details, categoryId: category.id };
        const product = current
          ? await tx.product.update({ where: { id: current.id }, data: { ...data, version: { increment: 1 } } })
          : await tx.product.create({ data: { ...data, importKey, slug: 'tw-' + model.key, published: process.argv.includes('--publish'), demo: false } });
        for (const color of new Set(model.photos.map(p => p.color))) for (const size of model.announcedSizes) {
          await tx.variant.upsert({ where: { productId_size_color: { productId: product.id, size, color } }, update: {}, create: { productId: product.id, size, color, available: false, availabilityConfirmed: false } });
        }
        const existingPhotos = await tx.photo.findMany({ where: { productId: product.id } });
        let position = Math.max(-1, ...existingPhotos.map(p => p.position)) + 1;
        for (const [index, photo] of model.photos.entries()) {
          const id = `import:${model.key}:${photo.color}`;
          if (await tx.photo.findUnique({ where: { id } })) continue;
          await tx.photo.create({ data: { id, productId: product.id, assetId: assets[index].id, url: assets[index].url, alt: photo.alt, color: photo.color, position: position++ } });
        }
      }, { timeout: 30000 });
      if (old) updated++; else created++;
    }
    if (process.argv.includes('--retire-demos')) {
      const ready = await db.product.count({ where: { importKey: { in: [...keys].map(k => 'zapatos1:' + k) }, published: true, deletedAt: null } });
      if (ready !== keys.size) throw new Error('No se retiran demos: faltan modelos importados publicados.');
      await db.product.updateMany({ where: { demo: true, published: true }, data: { published: false, version: { increment: 1 } } });
    }
    console.log(JSON.stringify({ created, updated, skipped, models: keys.size, provider: media.configuration().provider }));
  } finally { await app.close(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'Import failed'); process.exitCode = 1; });
