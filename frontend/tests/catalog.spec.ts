import { test, expect } from '@playwright/test';
import type { Product } from '../src/lib/catalog';
test.use({ reducedMotion: 'reduce' });
// This walkthrough loads all 25 photos and exercises several pages in Docker development mode.
test.setTimeout(120000);
const photoCount = (products: Product[]) => products.reduce((count, product) => count + Math.max(1, product.photos.length), 0);
test('inicio, catálogo, filtros y disponibilidad por talla/color', async ({ page }, info) => {
  await page.route('**/api/events', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Prueba: estadisticas no disponibles"}' }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Estilo y carácter en cada paso.' })).toBeVisible();
  await expect(page.locator('.home-grid article')).toHaveCount(4);
  await page.getByRole('link', { name: 'Conocer la marca', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cuero, identidad y estilo propio' })).toBeVisible();
  await expect(page.locator('.about-story p')).toHaveCount(4);
  await expect(page.locator('.collection-card')).toHaveCount(3);
  for (const image of await page.locator('.product-photo img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element: HTMLImageElement) => element.decode());
  }
  await page.evaluate(() => scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/home-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: 'Descubrir el catálogo' }).click();
  const published = await (await page.request.get('/api/catalog/products')).json();
  await expect(page.locator('.catalog-grid article')).toHaveCount(photoCount(published));
  const expectedPhotos = (published as Product[]).flatMap(product => product.photos.map(photo => photo.url)).sort();
  const actualPhotos = await page.locator('.catalog-grid img').evaluateAll(images => images.map(image => image.getAttribute('src') || '').sort());
  expect(actualPhotos).toEqual(expectedPhotos);
  for (const image of await page.locator('.catalog-grid img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element: HTMLImageElement) => element.decode());
  }
  await page.evaluate(() => scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/catalog-${info.project.name}.png`, fullPage: true });
  await page.getByLabel('Buscar modelo').fill('OXFORD CAFE');
  await page.getByLabel('Categoría', { exact: true }).selectOption('oxford');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.locator('.catalog-grid article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Oxford Cafe' })).toBeVisible();
  await page.getByLabel('Buscar modelo').fill('no-existe');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByRole('heading', { name: 'No encontramos modelos' })).toBeVisible();
  await page.getByRole('link', { name: 'Limpiar filtros', exact: true }).click();
  const currentPublished = await (await page.request.get('/api/catalog/products')).json();
  await expect(page.locator('.catalog-grid article')).toHaveCount(photoCount(currentPublished));
  await page.getByRole('link', { name: 'Ver Mustang, Negro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mustang', exact: true })).toBeVisible();
  await expect(page.locator('.gallery-caption')).toHaveText('Negro');
  await page.getByRole('button', { name: 'Negro', exact: true }).click();
  const firstAvailableSize = page.locator('.size-option:not([disabled])').first();
  const chosenSize = (await firstAvailableSize.textContent())?.trim() || '40';
  await firstAvailableSize.click();
  await expect(page.getByRole('status').filter({ hasText: new RegExp(`(Disponible|Disponibilidad por confirmar) en Negro, talla ${chosenSize}\\.?`) })).toBeVisible();
  const contact = page.getByRole('link', { name: 'Consultar por WhatsApp' });
  await expect(contact).toHaveAttribute('href', /https:\/\/wa.me\/59176928024/);
  expect(decodeURIComponent(await contact.getAttribute('href') || '')).toContain(`color Negro, talla ${chosenSize}`);
  await page.context().route('https://wa.me/**', route => route.fulfill({ status: 200, body: 'WhatsApp interceptado; no se envia mensaje.' }));
  const popup = page.waitForEvent('popup'); await contact.click(); await (await popup).close();
  await page.getByRole('button', { name: 'Ver fotografia 2: Cafe', exact: true }).click();
  await expect(page.locator('.gallery-caption')).toHaveText('Cafe');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/detail-${info.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});
test('retirados no accesibles y proxy público responde', async ({ page, request }) => {
  const health = await request.get('/api/health');
  expect((await health.json()).backend.database).toBe('connected');
  const catalog = await request.get('/api/catalog/products');
  expect(catalog.status()).toBe(200);
  expect((await catalog.json()).some((p: { id: string }) => p.id === 'demo-retirado')).toBe(false);
  await page.goto('/catalogo/modelo-retirado-demo');
  await expect(page.getByRole('heading', { name: 'Página no disponible' })).toBeVisible();
});
