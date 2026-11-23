import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const base = 'http://127.0.0.1:3001/api';
const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const manifest = JSON.parse(readFileSync('catalog/manifest.json', 'utf8'));
async function call(path, method = 'GET', body, cookie, trusted = true) {
  return fetch(base + path, { method, headers: { ...(trusted ? { Origin: origin, 'X-Topwalker-Request': '1' } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
test('Catalogo real, estadisticas y eliminacion logica', async t => {
  let fixture, cookie;
  try {
    await t.test('Importacion exacta e idempotente; variantes no confirmadas', async () => {
      const before = await db.product.findMany({ where: { importKey: { startsWith: 'zapatos1:' } }, include: { variants: true, photos: true }, orderBy: { id: 'asc' } });
      assert.equal(before.length, 12); assert.equal(before.flatMap(p => p.photos).length, 25);
      for (const model of manifest.products) {
        const p = before.find(p => p.importKey === 'zapatos1:' + model.key);
        assert.equal(p.price.toString(), model.price); assert.equal(p.description, model.description);
        assert.ok(p.variants.every(v => typeof v.available === 'boolean' && typeof v.availabilityConfirmed === 'boolean'));
        assert.deepEqual([...new Set(p.variants.map(v => v.size))].sort((a, b) => a - b), model.announcedSizes);
        assert.equal(p.photos.length, model.photos.length);
        for (const photo of p.photos) { const response = await call('/media/' + photo.assetId); assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /webp/); }
      }
      execFileSync('npm', ['run', 'catalog:import'], { stdio: 'pipe' });
      const after = await db.product.findMany({ where: { importKey: { startsWith: 'zapatos1:' } }, include: { variants: true, photos: true }, orderBy: { id: 'asc' } });
      assert.deepEqual(after, before);
    });
    await t.test('Estadisticas privadas; eventos validos, deduplicacion y filtros', async () => {
      assert.equal((await call('/admin/statistics')).status, 401);
      const user = JSON.parse(readFileSync('/tmp/topwalker-test-admins.json', 'utf8').replace(/^\uFEFF/, '')).users[0];
      const login = await call('/auth/login', 'POST', { identifier: user.username, password: user.password }); assert.equal(login.status, 200);
      cookie = login.headers.get('set-cookie').split(';')[0];
      fixture = await db.product.create({ data: { name: 'QA metrics ' + randomUUID(), slug: 'qa-metrics-' + randomUUID(), categoryId: 'botines', material: 'Prueba', description: 'Fixture automatizada de estadisticas', price: 1, published: true, demo: false, variants: { create: [{ color: 'Negro', size: 40, available: false, availabilityConfirmed: false }] } } });
      const visitorId = randomUUID();
      const event = { id: randomUUID(), visitorId, productId: fixture.id, type: 'PRODUCT_VIEW' };
      assert.equal((await call('/events', 'POST', event, undefined, false)).status, 403);
      assert.equal((await call('/events', 'POST', { ...event, type: 'INVALID' })).status, 400);
      assert.equal((await call('/events', 'POST', { ...event, type: 'SIZE_SELECT', size: 50, color: 'Negro' })).status, 400);
      assert.equal((await (await call('/events', 'POST', event, cookie)).json()).recorded, false, 'Admin browsing excluded');
      const results = await Promise.all(Array.from({ length: 4 }, () => call('/events', 'POST', event).then(r => r.json())));
      assert.equal(results.filter(r => r.recorded).length, 1);
      assert.equal((await (await call('/events', 'POST', { ...event, id: randomUUID() })).json()).recorded, false);
      for (const [type, selection] of [['COLOR_SELECT', { color: 'Negro' }], ['SIZE_SELECT', { color: 'Negro', size: 40 }], ['WHATSAPP_CLICK', { color: 'Negro', size: 40 }]]) {
        const response = await call('/events', 'POST', { ...event, id: randomUUID(), type, ...selection });
        assert.equal(response.status, 201); assert.equal((await response.json()).recorded, true);
      }
      assert.equal(await db.catalogEvent.count({ where: { productId: fixture.id } }), 4);
      const stats = await (await call('/admin/statistics?days=7', 'GET', undefined, cookie)).json();
      const row = stats.byViews.find(p => p.id === fixture.id); assert.equal(row.views, 1); assert.equal(row.clicks, 1); assert.equal(row.rate, 100);
      assert.ok(stats.sizes.some(p => p.productId === fixture.id && p.selections === 1 && p.clicks === 1));
      assert.ok(stats.colors.some(p => p.productId === fixture.id && p.selections === 1));
      assert.ok(stats.variants.some(p => p.productId === fixture.id && p.size === 40));
      const empty = await (await call('/admin/statistics?from=2000-01-01&to=2000-01-02', 'GET', undefined, cookie)).json(); assert.equal(empty.totals.views, 0);
      assert.equal((await call('/admin/statistics?from=2026-02-30', 'GET', undefined, cookie)).status, 400);
      assert.equal((await call('/admin/statistics?days=999', 'GET', undefined, cookie)).status, 400);
      let last;
      const limiter = randomUUID();
      for (let i = 0; i < 61; i++) last = await call('/events', 'POST', { ...event, id: randomUUID(), visitorId: limiter });
      assert.equal(last.status, 429);
    });
    await t.test('Eliminar requiere permiso/version y conserva historial sin republicacion', async () => {
      assert.equal((await call('/admin/products/' + fixture.id, 'DELETE', { version: 0 })).status, 401);
      assert.equal((await call('/admin/products/' + fixture.id, 'DELETE', { version: 3 }, cookie)).status, 409);
      assert.equal((await call('/admin/products/' + fixture.id, 'DELETE', { version: 0 }, cookie)).status, 200);
      assert.ok((await db.product.findUniqueOrThrow({ where: { id: fixture.id } })).deletedAt);
      assert.equal((await call('/catalog/products/' + fixture.slug)).status, 404);
      assert.equal((await call('/admin/products/' + fixture.id, 'GET', undefined, cookie)).status, 404);
      assert.ok(!(await (await call('/admin/products', 'GET', undefined, cookie)).json()).some(p => p.id === fixture.id));
      assert.equal((await call('/admin/products/' + fixture.id + '/publication', 'PATCH', { published: true, version: 1 }, cookie)).status, 404);
      assert.equal((await call('/events', 'POST', { id: randomUUID(), visitorId: randomUUID(), type: 'PRODUCT_VIEW', productId: fixture.id })).status, 404);
      assert.ok((await (await call('/admin/statistics', 'GET', undefined, cookie)).json()).byViews.some(p => p.id === fixture.id && p.deletedAt));
      assert.equal(await db.variant.count({ where: { productId: fixture.id } }), 1);
    });
  } finally {
    if (fixture) await db.product.update({ where: { id: fixture.id }, data: { demo: true, published: false, deletedAt: new Date() } });
    if (cookie) await call('/auth/logout', 'POST', undefined, cookie);
    await db.$disconnect();
  }
});
