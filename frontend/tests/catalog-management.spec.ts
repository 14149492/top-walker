import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AdminProduct } from '../src/lib/admin';

// No traces or videos: this test signs into the local administrative account.
test.use({ trace: 'off', video: 'off', screenshot: 'off', reducedMotion: 'reduce' });
test.setTimeout(180000);

test('gestion muestra las 25 fotos reales y permite abrir su edicion', async ({ page }, info) => {
  const source = JSON.parse(readFileSync(path.resolve('../backend/catalog/manifest.json'), 'utf8')) as { products: { photos: { sha256: string }[] }[] };
  const expected = source.products.flatMap(product => product.photos.map(photo => `/api/media/import-${photo.sha256}`)).sort();
  const account = JSON.parse(readFileSync(process.env.ADMIN_TEST_CREDENTIALS_FILE || path.resolve('../.work/accesos-locales.json'), 'utf8').replace(/^\uFEFF/, '')).users[0];
  await page.goto('/admin/login');
  await page.getByLabel('Correo o usuario').fill(account.username);
  await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Iniciar sesion', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole('link', { name: 'Gestionar productos' }).click();
  await expect(page.locator('.result-count')).toContainText('12 modelos · 25 fotografias');
  await expect(page.locator('.admin-product')).toHaveCount(12);
  await expect(page.locator('.admin-product-photos img')).toHaveCount(25);
  const products: AdminProduct[] = await (await page.request.get('/api/admin/products')).json();
  expect(products.every(product => !product.demo)).toBe(true);
  expect(products.flatMap(product => product.photos.map(photo => photo.url)).sort()).toEqual(expected);
  expect(await page.locator('.admin-product-photos img').evaluateAll(images => images.map(img => img.getAttribute('src')).sort())).toEqual(expected);
  for (const image of await page.locator('.admin-product-photos img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element: HTMLImageElement) => element.decode());
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `test-results/management-${info.project.name}.png`, fullPage: true });
  await page.getByLabel('Buscar modelo').fill('Mustang');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('.admin-product')).toHaveCount(1);
  await expect(page.locator('.admin-product-photos img')).toHaveCount(4);
  await page.getByRole('link', { name: 'Gestionar fotografia de Mustang: Negro', exact: true }).click();
  await expect(page).toHaveURL(/\/editar#fotografias$/);
  await expect(page.locator('#fotografias')).toBeVisible();
  await expect(page.locator('.photo-editor-card')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Cerrar sesion' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
