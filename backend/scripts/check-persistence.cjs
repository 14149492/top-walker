const { PrismaClient } = require('@prisma/client');
const { readFile, writeFile } = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const db = new PrismaClient();
(async () => {
  try {
    const products = await db.product.findMany({ orderBy: { id: 'asc' }, include: { variants: { orderBy: { id: 'asc' } }, photos: { orderBy: { position: 'asc' } } } });
    const events = await db.catalogEvent.findMany({ orderBy: { id: 'asc' } });
    const assets = await db.mediaAsset.findMany({ orderBy: { id: 'asc' } });
    const accounts = await db.adminUser.findMany({ orderBy: { id: 'asc' }, select: { id: true, username: true, active: true } });
    const files = [];
    for (const asset of assets.filter(a => a.provider === 'local')) {
      const bytes = await readFile(join(process.env.UPLOAD_DIR || '/app/uploads', asset.storageKey));
      files.push({ id: asset.id, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    const snapshot = JSON.stringify({ products, events, assets, accounts, files });
    // Persist the snapshot on the project upload volume so container recreation is also checked.
    const path = join(process.env.UPLOAD_DIR || '/app/uploads', '.persistence-check.json');
    if (process.argv.includes('--capture')) await writeFile(path, snapshot, { mode: 0o600 });
    else assert.equal(snapshot, await readFile(path, 'utf8'), 'Persistence snapshot changed');
    console.log(JSON.stringify({ mode: process.argv.includes('--capture') ? 'capture' : 'compare', products: products.length, events: events.length, photos: files.length, accounts: accounts.length, result: 'PASS' }));
  } finally { await db.$disconnect(); }
})().catch(() => { console.error('Persistence verification failed; compare the local snapshot privately.'); process.exitCode = 1; });
