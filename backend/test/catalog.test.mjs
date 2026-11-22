import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
const base = process.env.TEST_API_URL || 'http://127.0.0.1:3001/api';
const get = async path => {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200);
  return response.json();
};
test('salud comprueba PostgreSQL', async () => {
  assert.equal((await get('/health')).database, 'connected');
});
test('catálogo público coincide con PostgreSQL y omite retirados', async () => {
  const db = new PrismaClient();
  try {
    const products = await get('/catalog/products');
    assert.equal(products.length, await db.product.count({ where: { published: true } }));
    assert.ok(products.length >= 8, 'Ejecutar la semilla antes de estas pruebas');
    assert.ok(!products.some(p => p.id === 'demo-retirado'));
    assert.equal((await fetch(`${base}/catalog/products/modelo-retirado-demo`)).status, 404);
  } finally { await db.$disconnect(); }
});
test('búsqueda sin distinción de mayúsculas, filtros combinados y sin resultados', async () => {
  const products = await get('/catalog/products?q=OXFORD NEGRO&category=oxford');
  assert.equal(products.length, 1);
  assert.equal(products[0].slug, 'tw-oxford-negro');
  assert.deepEqual(await get('/catalog/products?q=no-existe'), []);
  assert.deepEqual(await get('/catalog/products?category=oxford&size=38'), []);
});
test('tallas anunciadas sin disponibilidad confirmada no pasan el filtro', async () => {
  const product = await get('/catalog/products/tw-mustang');
  assert.ok(product.variants.length > 0);
  assert.ok(product.variants.every(v => !v.available && !v.availabilityConfirmed));
  assert.deepEqual(await get('/catalog/products?q=Mustang&size=40'), []);
});

test('buscar con o sin tildes produce los mismos resultados y conserva filtros', async () => {
  const ids = rows => rows.map(row => row.id);
  const canonical = await get('/catalog/products?q=Oxford%20Cafe');
  assert.ok(canonical.length > 0);
  for (const term of ['oxford cafe', 'OXFORD CAF\u00c9', 'Oxford Cafe\u0301']) {
    assert.deepEqual(ids(await get('/catalog/products?q=' + encodeURIComponent(term))), ids(canonical));
  }
  assert.deepEqual(await get('/catalog/products?q=Mustang&category=oxford'), []);
  assert.deepEqual(await get('/catalog/products?q=' + encodeURIComponent("%' OR 1=1 --")), []);
  assert.deepEqual(await get('/catalog/products?q=%25'), []);
  assert.deepEqual(await get('/catalog/products?q=%5F'), []);
  assert.deepEqual(await get('/catalog/products?q=demostracion'), []);
});
test('rechaza entradas incorrectas y no expone escritura', async () => {
  for (const query of ['size=abc', 'size=-1', 'size=40.5', 'size=99', 'published=false', 'q=' + 'x'.repeat(101)]) {
    assert.equal((await fetch(`${base}/catalog/products?${query}`)).status, 400);
  }
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    assert.equal((await fetch(`${base}/catalog/products`, { method })).status, 404);
  }
});
test('detalle y filtros muestran datos almacenados', async () => {
  const product = await get('/catalog/products/tw-mustang');
  assert.equal(product.price, '350');
  assert.equal(product.photos[0].position, 0);
  assert.ok(product.description && product.material && product.variants.length);
  const filters = await get('/catalog/filters');
  assert.ok(filters.categories.some(c => c.id === 'botines'));
  assert.ok(Array.isArray(filters.sizes));
});
