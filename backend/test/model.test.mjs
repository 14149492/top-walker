import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
after(() => db.$disconnect());

// Every fixture lives in a rolled-back transaction, including failing assertions.
async function withModel(check) {
  const categoryId = randomUUID();
  const rollback = new Error('Rollback de fixture');
  try {
    await db.$transaction(async tx => {
      await tx.category.create({ data: { id: categoryId, name: `Prueba ${categoryId}` } });
      const product = await tx.product.create({
        data: {
          slug: `prueba-${randomUUID()}`, name: 'Modelo de prueba transaccional',
          material: 'Material de prueba', description: 'No se publica fuera de la transacción.',
          categoryId, price: '469.25',
          variants: { create: [
            { size: 38, color: 'Marrón' },
            { size: 38, color: 'Negro', available: true },
            { size: 39, color: 'Marrón', available: true },
          ] },
          photos: { create: [
            { url: '/prueba-secundaria.jpg', alt: 'Secundaria', position: 1 },
            { url: '/prueba-principal.jpg', alt: 'Principal', position: 0 },
          ] },
        },
        include: { variants: true, photos: true },
      });
      await check(tx, product);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    assert.equal(await db.category.findUnique({ where: { id: categoryId } }), null);
  }
}

test('disponibilidad independiente, precio exacto por modelo y retirada reversible', async () => {
  await withModel(async (tx, product) => {
    assert.equal(product.published, false);
    assert.equal(product.price.toFixed(2), '469.25');
    const brown38 = product.variants.find(v => v.size === 38 && v.color === 'Marrón');
    const black38 = product.variants.find(v => v.size === 38 && v.color === 'Negro');
    assert.equal(brown38.available, false);
    assert.equal(black38.available, true);
    await tx.variant.update({ where: { id: brown38.id }, data: { available: true } });
    await tx.variant.update({ where: { id: black38.id }, data: { available: false } });
    const preservedVariants = await tx.variant.findMany({ where: { productId: product.id }, orderBy: { id: 'asc' } });
    const preservedPhotos = await tx.photo.findMany({ where: { productId: product.id }, orderBy: { position: 'asc' } });
    assert.equal(preservedPhotos[0].alt, 'Principal');
    assert.equal(preservedVariants.find(v => v.id === brown38.id).available, true);
    assert.equal(preservedVariants.find(v => v.id === black38.id).available, false);
    for (const published of [true, false, true]) {
      const updated = await tx.product.update({ where: { id: product.id }, data: { published } });
      assert.equal(updated.id, product.id);
      assert.equal(updated.slug, product.slug);
      assert.equal(updated.price.toFixed(2), '469.25');
      assert.equal(await tx.product.count({ where: { id: product.id, published: true } }), published ? 1 : 0);
      assert.deepEqual(await tx.variant.findMany({ where: { productId: product.id }, orderBy: { id: 'asc' } }), preservedVariants);
      assert.deepEqual(await tx.photo.findMany({ where: { productId: product.id }, orderBy: { position: 'asc' } }), preservedPhotos);
    }
    await tx.variant.updateMany({ where: { productId: product.id }, data: { available: false } });
    assert.equal((await tx.product.findUnique({ where: { id: product.id } })).published, true);
  });
});

test('PostgreSQL rechaza talla/color duplicados en el mismo modelo', async () => {
  await assert.rejects(withModel((tx, product) => tx.variant.create({ data: { productId: product.id, size: 38, color: 'Negro' } })), { code: 'P2002' });
});

test('PostgreSQL rechaza dos imágenes en la posición principal', async () => {
  await assert.rejects(withModel((tx, product) => tx.photo.create({ data: { productId: product.id, url: '/duplicada.jpg', alt: 'Duplicada', position: 0 } })), { code: 'P2002' });
});

test('PostgreSQL rechaza precios no positivos', async () => {
  for (const price of ['0', '-1.00']) {
    await assert.rejects(withModel((tx, product) => tx.product.update({ where: { id: product.id }, data: { price } })), /Product_price_check/);
  }
});

test('PostgreSQL rechaza tallas y posiciones inválidas', async () => {
  await assert.rejects(withModel((tx, product) => tx.variant.create({ data: { productId: product.id, size: 0, color: 'Negro' } })), /Variant_size_check/);
  await assert.rejects(withModel((tx, product) => tx.photo.create({ data: { productId: product.id, url: '/invalida.jpg', alt: 'Inválida', position: -1 } })), /Photo_position_check/);
});
