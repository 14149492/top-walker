import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const credentialsPath = process.env.ADMIN_TEST_CREDENTIALS_FILE || path.resolve(process.cwd(), '../.work/accesos-locales.json');
const users: { username: string; email: string; password: string }[] = JSON.parse(readFileSync(credentialsPath, 'utf8').replace(/^\uFEFF/, '')).users;
// Authentication inputs and cookies must never be recorded in traces or videos.
test.use({ trace: 'off', video: 'off', actionTimeout: 30000, navigationTimeout: 60000 });
test.setTimeout(240000);
async function login(page: Page, account = 0, byEmail = false) {
  await page.goto('/admin/login');
  await page.getByLabel('Correo o usuario').fill(byEmail ? users[account].email : users[account].username);
  await page.getByLabel('Contraseña', { exact: true }).fill(users[account].password);
  await page.getByRole('button', { name: 'Iniciar sesion', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('link', { name: 'Gestionar productos' })).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function variantRow(page: Page, color: string, size: number) {
  const rows = page.locator('.variant-row');
  const index = await rows.evaluateAll((elements, match) => elements.findIndex(row => {
    const inputs = row.querySelectorAll('input');
    return inputs[0].value === match.color && Number(inputs[1].value) === match.size;
  }), { color, size });
  expect(index).toBeGreaterThanOrEqual(0);
  return rows.nth(index);
}
test('HU-06: protección, error de credenciales, acceso y cierre desde el navegador', async ({ page, context }, info) => {
  for (const route of ['/admin', '/admin/productos', '/admin/productos/nuevo', '/admin/productos/demo-urbano/editar']) {
    await page.goto(route); await expect(page).toHaveURL(/\/admin\/login$/);
  }
  await expect(page.locator('.login-card img')).toBeVisible(); await noOverflow(page);
  await page.screenshot({ path: `test-results/admin-login-${info.project.name}.png`, fullPage: true });
  await page.getByLabel('Correo o usuario').fill(users[0].username);
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta-solo-prueba');
  await page.getByRole('button', { name: 'Iniciar sesion', exact: true }).click();
  await expect(page.locator('.form-error[role="alert"]')).toContainText('incorrectos');
  await login(page, 0, true);
  const cookie = (await context.cookies()).find(c => c.name === 'topwalker_session');
  expect(cookie?.httpOnly).toBe(true); expect(cookie?.sameSite).toBe('Lax');
  expect(await page.evaluate(() => document.cookie.includes('topwalker_session'))).toBe(false);
  await noOverflow(page); await page.screenshot({ path: `test-results/admin-panel-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await page.request.get('/api/admin/products')).status()).toBe(401);
  await page.goto('/admin'); await expect(page).toHaveURL(/\/admin\/login$/);
});

test('HU-07 a HU-10: registro, fotografías, edición, variantes y publicación', async ({ page }, info) => {
  const name = `QA navegador ${info.project.name} ${randomUUID().slice(0, 8)}`;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  let productId = '';
  const headers = { Origin: 'http://localhost:3000', 'X-Topwalker-Request': '1' };
  try {
    await login(page);
    await page.getByRole('link', { name: 'Registrar producto' }).click();
    await expect(page.getByLabel('Nombre del modelo')).toBeEnabled();
    await page.getByLabel('Nombre del modelo').fill(name);
    await page.getByLabel('Material', { exact: true }).fill('Cuero de demostración');
    await page.getByLabel('Precio en Bs').fill('450.50');
    await page.getByLabel('Plantas', { exact: true }).fill('Super ligeras antideslizantes');
    await page.getByLabel('Plantilla interna', { exact: true }).fill('Piel de res y acolchado');
    await page.getByLabel('Forro interno', { exact: true }).fill('Piel de res badana');
    await page.getByLabel('Categoria', { exact: true }).selectOption('urbano');
    await page.getByLabel('Descripcion', { exact: true }).fill('Modelo de demostración creado y editado mediante la interfaz administrativa.');
    await page.getByLabel('Color 1', { exact: true }).fill('Negro');
    await page.getByRole('button', { name: 'Añadir combinacion' }).click();
    await page.getByLabel('Color 2', { exact: true }).fill('Negro');
    await page.getByLabel('Talla 2', { exact: true }).fill('41');
    await page.getByLabel('Disponible 2', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Añadir combinacion' }).click();
    await page.getByLabel('Color 3', { exact: true }).fill('Marrón');
    // Real image uploads, explicitly labelled as demonstrations in the stored product.
    await page.getByLabel('Añadir fotografias').setInputFiles([
      path.resolve('public/demo/home-reference.png'), path.resolve('public/demo/catalog-reference.png'),
    ]);
    await expect(page.locator('.photo-editor-card')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Guardar producto', exact: true })).toBeEnabled();
    await page.getByLabel('Texto alternativo 1').fill('Referencia demostrativa A');
    await page.getByLabel('Texto alternativo 2').fill('Referencia demostrativa B');
    await page.getByRole('button', { name: 'Hacer principal' }).click();
    await expect(page.getByLabel('Texto alternativo 1')).toHaveValue('Referencia demostrativa B');
    await page.getByLabel('Producto de demostracion', { exact: true }).check();
    await page.getByLabel('Talla 2', { exact: true }).fill('40');
    await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
    await expect(page.locator('.form-error[role="alert"]')).toContainText('duplicadas');
    await page.getByLabel('Talla 2', { exact: true }).fill('41');
    await page.getByLabel('Precio en Bs').fill('0');
    await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
    await expect(page.locator('.form-error[role="alert"]')).toContainText('mayor que cero');
    await page.getByLabel('Precio en Bs').fill('450.50');
    await noOverflow(page); await page.screenshot({ path: `test-results/admin-form-${info.project.name}.png`, fullPage: true });
    const createdResponse = page.waitForResponse(r => r.url().endsWith('/api/admin/products') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
    const created = await createdResponse; expect(created.status()).toBe(201);
    const product = await created.json(); productId = product.id;
    await expect(page.getByRole('status').filter({ hasText: 'Producto guardado correctamente' })).toBeVisible();
    await page.getByLabel('Buscar modelo').fill(name); await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    const row = page.locator('.admin-product').filter({ hasText: name });
    await expect(row.locator('.status-badge')).toHaveText('Retirado');
    expect((await page.request.get(`/api/catalog/products/${product.slug}`)).status()).toBe(404);
    await row.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(row.locator('.status-badge')).toHaveText('Publicado');
    await noOverflow(page); await page.screenshot({ path: `test-results/admin-products-${info.project.name}.png`, fullPage: true });
    await row.getByRole('link', { name: 'Ver ficha publica' }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(page.locator('.product-characteristics')).toContainText('Super ligeras antideslizantes');
    await expect(page.locator('.product-characteristics')).toContainText('Piel de res y acolchado');
    await expect(page.locator('.product-characteristics')).toContainText('Piel de res badana');
    await noOverflow(page);
    await page.getByRole('button', { name: 'Negro', exact: true }).click();
    await expect(page.getByRole('button', { name: '41', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '40', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Disponible en Negro, talla 40' })).toBeVisible();
    // The second account can maintain the same model without recreating it.
    await page.goto('/admin'); await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/); await login(page, 1, true);
    await page.goto(`/admin/productos/${product.id}/editar`);
    await expect(page.getByLabel('Nombre del modelo')).toHaveValue(name);
    await expect(page.getByLabel('Plantas', { exact: true })).toHaveValue('Super ligeras antideslizantes');
    await expect(page.getByLabel('Plantilla interna', { exact: true })).toHaveValue('Piel de res y acolchado');
    await expect(page.getByLabel('Forro interno', { exact: true })).toHaveValue('Piel de res badana');
    await page.getByLabel('Plantas', { exact: true }).fill('Plantas actualizadas');
    await page.getByLabel('Forro interno', { exact: true }).fill('');
    await expect(page.getByLabel('Texto alternativo 1')).toHaveValue('Referencia demostrativa B');
    await page.getByLabel('Nombre del modelo').fill(name + ' editado');
    await page.getByLabel('Material', { exact: true }).fill('Cuero actualizado');
    await page.getByLabel('Descripcion', { exact: true }).fill('Descripcion actualizada y persistida por el ayudante.');
    await page.getByLabel('Precio en Bs').fill('499.90');
    await page.getByLabel('Categoria', { exact: true }).selectOption('oxford');
    const black40 = await variantRow(page, 'Negro', 40);
    await black40.getByRole('checkbox', { name: /^Disponible/ }).uncheck();
    const black41 = await variantRow(page, 'Negro', 41);
    await black41.getByRole('checkbox', { name: /^Disponible/ }).check();
    await black41.locator('input[type="number"]').fill('42');
    await black41.locator('input:not([type])').fill('Azul');
    await page.getByRole('button', { name: 'Añadir combinacion' }).click();
    await page.getByLabel('Color 4', { exact: true }).fill('Marrón'); await page.getByLabel('Talla 4', { exact: true }).fill('43');
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/productos\?saved=1/);
    const updated = await (await page.request.get(`/api/catalog/products/${product.slug}`)).json();
    expect(updated.id).toBe(product.id); expect(updated.name).toBe(name + ' editado'); expect(updated.price).toBe('499.9');
    expect(updated.category.id).toBe('oxford'); expect(updated.variants).toHaveLength(4);
    expect(updated.sole).toBe('Plantas actualizadas'); expect(updated.lining).toBeNull();
    await page.goto(`/catalogo/${product.slug}`);
    await expect(page.locator('.product-characteristics')).toContainText('Plantas actualizadas');
    await expect(page.locator('.product-characteristics dt').filter({ hasText: 'Forro interno' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Negro', exact: true }).click(); await expect(page.getByRole('button', { name: '40', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Azul', exact: true }).click(); await page.getByRole('button', { name: '42', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Disponible en Azul, talla 42' })).toBeVisible();
    await page.goto(`/catalogo?q=${encodeURIComponent(name)}&size=42`); await expect(page.locator('.catalog-grid article')).toHaveCount(1);
    await page.goto(`/admin/productos?q=${encodeURIComponent(name)}`);
    await page.getByRole('button', { name: 'Retirar', exact: true }).click();
    await expect(page.locator('.status-badge')).toHaveText('Retirado');
    expect((await page.request.get(`/api/catalog/products/${product.slug}`)).status()).toBe(404);
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(page.locator('.status-badge')).toHaveText('Publicado');
    expect((await page.request.get(`/api/catalog/products/${product.slug}`)).status()).toBe(200);
    expect(errors).toEqual([]);
  } finally {
    // Keep QA records as withdrawn demos so they do not alter the public baseline.
    if (productId) {
      const response = await page.request.get(`/api/admin/products/${productId}`);
      if (response.ok()) {
        const current = await response.json();
        expect((await page.request.patch(`/api/admin/products/${productId}/publication`, { headers, data: { published: false, version: current.version } })).ok()).toBe(true);
      }
    }
    await page.request.post('/api/auth/logout', { headers });
  }
});
