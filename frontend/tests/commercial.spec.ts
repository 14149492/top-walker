import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const users = JSON.parse(readFileSync('../.work/accesos-locales.json', 'utf8').replace(/^\uFEFF/, '')).users;
test.use({ trace: 'off', video: 'off' });
test.setTimeout(240000);
test('TW, estadisticas reales de fixture, WhatsApp y eliminacion logica', async ({ page, context }, info) => {
  const headers = { Origin: 'http://localhost:3000', 'X-Topwalker-Request': '1' };
  const name = `QA comercial ${randomUUID()}`;
  let id = '';
  async function login() {
    await page.goto('/');
    await page.getByRole('link', { name: 'Acceso al panel Top Walker' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.getByLabel('Correo o usuario').fill(users[0].username);
    await page.getByLabel('Contraseña', { exact: true }).fill(users[0].password);
    await page.getByRole('button', { name: 'Iniciar sesion', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }
  try {
    await login();
    const source = (await (await page.request.get('/api/admin/products?q=Mustang')).json())[0];
    const data = { name, description: 'Fixture automatizada temporal, no es una oferta comercial.', categoryId: source.categoryId, material: 'Prueba', price: '1', published: true, demo: false, variants: [{ color: 'Negro', size: 40, available: false, availabilityConfirmed: false }], photos: [{ assetId: source.photos[0].assetId, alt: 'Fixture de prueba' }] };
    const create = await page.request.post('/api/admin/products', { headers, data }); expect(create.status()).toBe(201);
    const product = await create.json(); id = product.id;
    await page.getByRole('button', { name: 'Cerrar sesion' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    const events: Promise<number>[] = [];
    page.on('response', response => { if (response.url().endsWith('/api/events')) events.push(Promise.resolve(response.status())); });
    await page.goto('/catalogo/' + product.slug);
    await page.getByRole('button', { name: 'Negro', exact: true }).click();
    await page.getByRole('button', { name: '40', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Disponibilidad por confirmar' })).toBeVisible();
    const link = page.getByRole('link', { name: 'Consultar por WhatsApp' });
    expect(decodeURIComponent((await link.getAttribute('href'))!)).toContain('color Negro, talla 40');
    await context.route('https://wa.me/**', route => route.fulfill({ status: 200, body: 'Destino WhatsApp interceptado en prueba; no se envia mensaje.' }));
    const popup = page.waitForEvent('popup'); await link.click(); await (await popup).close();
    await expect.poll(() => events.length).toBeGreaterThanOrEqual(4);
    expect(await Promise.all(events)).toEqual([201, 201, 201, 201]);
    await login();
    await page.getByRole('link', { name: 'Acceso al panel Top Walker' }).click(); await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole('link', { name: 'Estadisticas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Estadisticas comerciales' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: name }).first()).toContainText('100 %');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/stats-${info.project.name}.png`, fullPage: true });
    await page.goto('/admin/productos?q=' + encodeURIComponent(name));
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByRole('group', { name: 'Confirmar eliminacion de ' + name })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    // Mark as demo before deletion so automated interactions never pollute the business report.
    const current = await (await page.request.get('/api/admin/products/' + id)).json();
    const change = await page.request.put('/api/admin/products/' + id, { headers, data: { ...data, demo: true, version: current.version, photos: current.photos.map((p: { id: string; assetId: string; alt: string }) => ({ id: p.id, assetId: p.assetId, alt: p.alt })), variants: current.variants.map((v: { id: string; color: string; size: number; available: boolean; availabilityConfirmed: boolean }) => ({ id: v.id, color: v.color, size: v.size, available: v.available, availabilityConfirmed: v.availabilityConfirmed })) } });
    expect(change.ok()).toBe(true);
    await page.reload(); await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar eliminacion', exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
    expect((await page.request.get('/api/catalog/products/' + product.slug)).status()).toBe(404);
  } finally {
    // In a failed run, retain the fixture as a withdrawn demo via the protected API.
    await page.request.post('/api/auth/login', { headers, data: { identifier: users[0].username, password: users[0].password } });
    if (id) {
      const response = await page.request.get('/api/admin/products/' + id);
      if (response.ok()) {
        const p = await response.json();
        await page.request.put('/api/admin/products/' + id, { headers, data: { name: p.name, description: p.description, material: p.material, categoryId: p.categoryId, price: p.price, published: false, demo: true, version: p.version, variants: p.variants.map((v: { id: string; color: string; size: number; available: boolean }) => ({ id: v.id, color: v.color, size: v.size, available: v.available })), photos: p.photos.map((p: { id: string; assetId: string; alt: string }) => ({ id: p.id, assetId: p.assetId, alt: p.alt })) } });
      }
    }
    await page.request.post('/api/auth/logout', { headers });
  }
});
