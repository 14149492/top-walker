import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Product } from '../src/lib/catalog';

test.use({ trace: 'off', video: 'off', screenshot: 'off', reducedMotion: 'reduce' });
test.setTimeout(120000);

test('estadisticas muestran las fotos devueltas por la API protegida', async ({ page }, info) => {
  expect((await page.request.get('/api/admin/statistics')).status()).toBe(401);
  const user = JSON.parse(readFileSync('../.work/accesos-locales.json', 'utf8').replace(/^\uFEFF/, '')).users[0];
  await page.goto('/admin/login');
  await page.getByLabel('Correo o usuario').fill(user.username);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Iniciar sesion', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const response = await page.request.get('/api/admin/statistics?days=90');
  expect(response.status()).toBe(200);
  const stats = await response.json();
  const rows: { name: string; photo: Product['photos'][number] | null }[] = [stats.byViews, stats.byClicks, stats.sizes, stats.colors, stats.variants].flat();
  await page.goto('/admin/estadisticas?days=90');
  await expect(page.getByRole('heading', { name: 'Estadisticas comerciales' })).toBeVisible();
  await expect(page.locator('.stats-product')).toHaveCount(rows.length);
  await expect(page.locator('.stats-product-photo img')).toHaveCount(rows.filter(row => row.photo).length);
  await expect(page.locator('.stats-no-photo')).toHaveCount(rows.filter(row => !row.photo).length);
  const photos = await page.locator('.stats-product-photo img').evaluateAll(images => images.map(img => img.getAttribute('src')).sort());
  expect(photos).toEqual(rows.flatMap(row => row.photo ? [row.photo.url] : []).sort());
  for (const image of await page.locator('.stats-product-photo img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element: HTMLImageElement) => element.decode());
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `test-results/statistics-photos-${info.project.name}.png`, fullPage: true });
  console.log(`${info.project.name}: ${rows.length} filas, ${photos.length} fotos verificadas; datos existentes, sin eventos de prueba.`);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
