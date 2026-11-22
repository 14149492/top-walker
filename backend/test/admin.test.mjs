import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const base = process.env.TEST_API_URL || 'http://127.0.0.1:3001/api';
const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const credentials = JSON.parse(readFileSync(process.env.ADMIN_TEST_CREDENTIALS_FILE || '/tmp/topwalker-test-admins.json', 'utf8').replace(/^\uFEFF/, '')).users;
const db = new PrismaClient();
const created = [];
async function request(path, { method = 'GET', cookie, body, trusted = true } = {}) {
  return fetch(base + path, {
    method,
    headers: { ...(trusted ? { Origin: origin, 'X-Topwalker-Request': '1' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
}
async function json(path, options, expected = 200) {
  const response = await request(path, options);
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}
async function login(user, identifier = user.username) {
  const response = await request('/auth/login', { method: 'POST', body: { identifier, password: user.password } });
  assert.equal(response.status, 200, 'El inicio de sesión debe ser válido');
  const header = response.headers.get('set-cookie');
  assert.match(header, /HttpOnly/i); assert.match(header, /SameSite=Lax/i);
  const data = await response.json();
  assert.ok(!JSON.stringify(data).includes('password') && !JSON.stringify(data).includes('token'));
  return header.split(';')[0];
}
function payload(product) {
  return {
    name: product.name, description: product.description, material: product.material, categoryId: product.categoryId,
    price: product.price, demo: product.demo, published: product.published, version: product.version,
    variants: product.variants.map(({ id, size, color, available }) => ({ id, size, color, available })),
    photos: product.photos.map(({ id, assetId, alt }) => ({ id, ...(assetId ? { assetId } : {}), alt })),
  };
}

test('HU-06 a HU-10: API administrativa integrada con PostgreSQL', async t => {
  let owner, helper, product, asset, secondAsset;
  try {
    await t.test('HU-06: acceso anónimo, credenciales erróneas y CSRF rechazados', async () => {
      for (const path of ['/auth/me', '/admin/products', '/admin/categories', '/admin/media/config']) assert.equal((await request(path)).status, 401);
      assert.equal((await request('/admin/products', { method: 'POST', body: {} })).status, 401);
      assert.equal((await request('/auth/login', { method: 'POST', body: { identifier: credentials[0].username, password: 'incorrecta-solo-prueba' } })).status, 401);
      assert.equal((await request('/auth/login', { method: 'POST', body: {} })).status, 400);
      assert.equal((await request('/auth/login', { method: 'POST', trusted: false, body: { identifier: credentials[0].username, password: credentials[0].password } })).status, 403);
    });
    await t.test('HU-06: ambas cuentas acceden por usuario o correo, hashes y sesiones seguras', async () => {
      owner = await login(credentials[0]); helper = await login(credentials[1], credentials[1].email);
      const a = await json('/auth/me', { cookie: owner }), b = await json('/auth/me', { cookie: helper });
      assert.notEqual(a.id, b.id);
      assert.equal((await request('/admin/products', { cookie: helper })).status, 200);
      const accentIds = async term => (await json('/admin/products?q=' + encodeURIComponent(term), { cookie: helper })).map(p => p.id);
      assert.deepEqual(await accentIds('botin'), await accentIds('BOTÍN'));
      assert.ok((await accentIds('botin')).length > 0);
      assert.ok((await accentIds('demostracion')).includes('demo-retirado'));
      const stored = await db.adminUser.findUniqueOrThrow({ where: { id: a.id } });
      assert.match(stored.passwordHash, /^scrypt\$131072\$8\$1\$/);
      assert.notEqual(stored.passwordHash, credentials[0].password);
      const token = owner.split('=')[1];
      assert.ok(await db.adminSession.findUnique({ where: { tokenHash: createHash('sha256').update(token).digest('hex') } }));
      assert.equal(await db.adminSession.findUnique({ where: { tokenHash: token } }), null);
      assert.equal((await request('/admin/categories', { method: 'POST', cookie: owner, trusted: false, body: { name: 'Bloqueada' } })).status, 403);
    });
    await t.test('HU-07: carga real de imágenes, validación del contenido y privacidad del borrador', async () => {
      const buffer = await sharp({ create: { width: 100, height: 80, channels: 3, background: '#746451' } }).png().toBuffer();
      async function upload(bytes, type) {
        const body = new FormData(); body.append('file', new Blob([bytes], { type }), 'demostracion.png');
        return request('/admin/media', { method: 'POST', cookie: owner, body });
      }
      assert.equal((await upload(Buffer.from('<svg></svg>'), 'image/svg+xml')).status, 400);
      assert.equal((await upload(Buffer.from('not an image'), 'image/png')).status, 400);
      const response = await upload(buffer, 'image/png'); assert.equal(response.status, 201); asset = await response.json();
      const second = await upload(buffer, 'image/png'); assert.equal(second.status, 201); secondAsset = await second.json();
      assert.equal((await request('/media/' + asset.id)).status, 404);
      const preview = await request('/media/' + asset.id, { cookie: owner });
      assert.equal(preview.status, 200); assert.match(preview.headers.get('content-type'), /image\/webp/);
      assert.ok((await preview.arrayBuffer()).byteLength > 0);
    });
    await t.test('HU-07: validaciones, alta publicada y consulta pública desde PostgreSQL', async () => {
      const category = await json('/admin/categories', { method: 'POST', cookie: owner, body: { name: `QA categoría ${randomUUID().slice(0, 8)}` } }, 201);
      const repeated = await json('/admin/categories', { method: 'POST', cookie: helper, body: { name: category.name.toUpperCase() } }, 201);
      assert.equal(repeated.id, category.id);
      const body = {
        name: `QA API ${randomUUID()}`, description: 'Calzado demostrativo creado por la prueba administrativa.', material: 'Cuero de demostración',
        price: '450.50', categoryId: category.id, published: true, demo: true,
        sole: 'Super ligeras antideslizantes', insole: 'Piel de res y acolchado', lining: 'Piel de res badana',
        variants: [{ size: 40, color: 'Negro', available: true }, { size: 41, color: 'Negro', available: false }, { size: 40, color: 'Marrón', available: true }],
        photos: [{ assetId: asset.id, alt: 'Imagen demostrativa principal' }, { assetId: secondAsset.id, alt: 'Imagen demostrativa secundaria' }],
      };
      for (const changes of [{ name: '' }, { price: '0' }, { price: '-5' }, { price: '4.999' }, { categoryId: 'inexistente' }, { photos: [] }, { variants: [] }, { variants: [{ size: 0, color: 'Negro', available: true }] }, { unexpected: true }]) {
        assert.equal((await request('/admin/products', { method: 'POST', cookie: owner, body: { ...body, ...changes } })).status, 400);
      }
      product = await json('/admin/products', { method: 'POST', cookie: owner, body }, 201); created.push(product.id);
      for (const key of ['sole', 'insole', 'lining']) {
        assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } }))[key], body[key]);
        assert.equal((await json('/catalog/products/' + product.slug))[key], body[key]);
        for (const value of [42, 'x'.repeat(201)]) {
          assert.equal((await request('/admin/products', { method: 'POST', cookie: owner, body: { ...body, [key]: value } })).status, 400);
        }
      }
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).price.toString(), '450.5');
      const visible = await json('/catalog/products/' + product.slug);
      assert.equal(visible.id, product.id); assert.equal(visible.variants.length, 3); assert.equal(visible.photos[0].position, 0);
      assert.equal((await request('/media/' + asset.id)).status, 200);
      assert.equal((await request('/admin/products', { method: 'POST', cookie: owner, body: { ...body, name: body.name.toLowerCase() } })).status, 409);
      assert.ok((await json('/admin/products?q=' + encodeURIComponent(body.name), { cookie: helper })).some(p => p.id === product.id));
    });
    await t.test('HU-08/HU-10: edición por el ayudante, conservación de IDs, orden y prevención de duplicados', async () => {
      const original = product, body = payload(product);
      assert.equal((await request('/admin/products/' + product.id, { method: 'PUT', cookie: owner, body: { ...body, variants: [body.variants[0], { size: body.variants[0].size, color: ` ${body.variants[0].color.toLowerCase()} `, available: false }] } })).status, 400);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).version, original.version);
      body.name += ' editado'; body.description = 'Descripción actualizada desde el ayudante.'; body.material = 'Cuero actualizado'; body.price = '499.90';
      body.variants[0].available = false;
      body.variants[1].size = 42; body.variants[1].color = 'Azul'; body.variants[1].available = true;
      body.variants.push({ size: 43, color: 'Marrón', available: true }); body.photos.reverse();
      product = await json('/admin/products/' + product.id, { method: 'PUT', cookie: helper, body });
      assert.equal(product.id, original.id); assert.equal(product.slug, original.slug);
      for (const key of ['sole', 'insole', 'lining']) assert.equal(product[key], original[key], 'Omitted characteristics must be preserved');
      assert.equal(product.photos[0].id, original.photos[1].id); assert.equal(product.photos[0].position, 0);
      assert.ok(original.variants.every(v => product.variants.some(next => next.id === v.id)));
      assert.equal((await request('/admin/products/' + product.id, { method: 'PUT', cookie: owner, body: payload(original) })).status, 409);
      const visible = await json('/catalog/products/' + product.slug);
      assert.equal(visible.name, body.name); assert.equal(visible.price, '499.9');
      assert.ok(visible.variants.some(v => v.size === 42 && v.color === 'Azul' && v.available));
      assert.ok((await json('/catalog/products?q=' + encodeURIComponent(product.name) + '&size=42')).some(p => p.id === product.id));
      const allUnavailable = payload(product); allUnavailable.variants.forEach(v => { v.available = false; });
      allUnavailable.sole = 'Plantas actualizadas'; allUnavailable.insole = ''; allUnavailable.lining = null;
      product = await json('/admin/products/' + product.id, { method: 'PUT', cookie: helper, body: allUnavailable });
      const characteristics = await json('/catalog/products/' + product.slug);
      assert.equal(characteristics.sole, 'Plantas actualizadas'); assert.equal(characteristics.insole, null); assert.equal(characteristics.lining, null);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).insole, null);
      assert.deepEqual(await json('/catalog/products?q=' + encodeURIComponent(product.name) + '&size=42'), []);
      assert.ok((await json('/catalog/products/' + product.slug)).variants.every(v => !v.available));
    });
    await t.test('HU-09: retirada y republicación conservan información y relaciones', async () => {
      const original = product;
      product = await json('/admin/products/' + product.id + '/publication', { method: 'PATCH', cookie: owner, body: { published: false, version: product.version } });
      assert.equal((await request('/catalog/products/' + product.slug)).status, 404);
      assert.equal((await request('/media/' + asset.id)).status, 404);
      assert.equal((await json('/admin/products/' + product.id, { cookie: helper })).published, false);
      assert.deepEqual(product.variants, original.variants); assert.deepEqual(product.photos, original.photos);
      product = await json('/admin/products/' + product.id + '/publication', { method: 'PATCH', cookie: helper, body: { published: true, version: product.version } });
      assert.equal((await request('/catalog/products/' + product.slug)).status, 200);
      assert.equal((await request('/admin/products/' + product.id, { method: 'DELETE', cookie: owner })).status, 400);
    });
    await t.test('HU-06: cierre revoca la sesión; las sesiones vencidas son rechazadas', async () => {
      const closed = await request('/auth/logout', { method: 'POST', cookie: owner }); assert.equal(closed.status, 200);
      assert.equal((await request('/auth/me', { cookie: owner })).status, 401);
      assert.equal((await request('/admin/products', { cookie: owner })).status, 401);
      const tokenHash = createHash('sha256').update(helper.split('=')[1]).digest('hex');
      await db.adminSession.update({ where: { tokenHash }, data: { expiresAt: new Date(Date.now() - 1000) } });
      assert.equal((await request('/auth/me', { cookie: helper })).status, 401);
    });
  } finally {
    // Test records are retained as withdrawn demonstrations, never physically deleted.
    await db.product.updateMany({ where: { id: { in: created } }, data: { published: false } });
    if (owner) await request('/auth/logout', { method: 'POST', cookie: owner });
    if (helper) await request('/auth/logout', { method: 'POST', cookie: helper });
    await db.$disconnect();
  }
});
