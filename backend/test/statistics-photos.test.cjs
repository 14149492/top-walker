const test = require('node:test');
const assert = require('node:assert/strict');
const { AnalyticsService } = require('../dist/analytics/analytics.service');

function service(photo) {
  const groups = ['PRODUCT_VIEW', 'COLOR_SELECT', 'SIZE_SELECT', 'WHATSAPP_CLICK'].map(type => ({ productId: 'model', type, size: type === 'SIZE_SELECT' || type === 'WHATSAPP_CLICK' ? 40 : null, color: type === 'PRODUCT_VIEW' ? null : 'Negro', _count: { _all: 1 } }));
  return new AnalyticsService({
    catalogEvent: { groupBy: async () => groups },
    product: { findMany: async query => {
      assert.deepEqual(query.select.photos, { orderBy: { position: 'asc' }, take: 1, select: { url: true, alt: true, position: true } });
      return [{ id: 'model', name: 'Modelo de prueba', deletedAt: photo ? null : new Date(), photos: photo ? [photo] : [] }];
    } },
    $queryRaw: async () => [],
  });
}

for (const photo of [{ url: '/api/media/test', alt: 'Modelo negro', position: 0 }, null]) {
  test(photo ? 'Foto principal en todos los informes sin alterar metricas' : 'Historico sin foto conserva metricas y devuelve null', async () => {
    const summary = await service(photo).summary({ days: '7' });
    assert.deepEqual(summary.totals, { views: 1, clicks: 1, sizeSelections: 1, colorSelections: 1 });
    for (const rows of [summary.byViews, summary.byClicks, summary.sizes, summary.colors, summary.variants]) {
      assert.equal(rows.length, 1);
      assert.deepEqual(rows[0].photo, photo);
      assert.equal(rows[0].name, 'Modelo de prueba');
    }
    assert.equal(summary.byViews[0].rate, 100);
  });
}
