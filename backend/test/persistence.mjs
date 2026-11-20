import { PrismaClient } from '@prisma/client';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const db = new PrismaClient();
try {
  const rows = await db.product.findMany({ orderBy: { id: 'asc' }, include: { variants: { orderBy: { id: 'asc' } }, photos: { orderBy: { id: 'asc' } } } });
  const users = await db.adminUser.findMany({ orderBy: { id: 'asc' }, select: { id: true, username: true, email: true, active: true } });
  const assets = await db.mediaAsset.findMany({ orderBy: { id: 'asc' } });
  const files = [];
  for (const asset of assets.filter(a => a.provider === 'local')) {
    const bytes = await readFile(join(process.env.UPLOAD_DIR || '/app/uploads', asset.storageKey));
    files.push({ id: asset.id, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  const snapshot = JSON.stringify({ products: rows, users, assets, files });
  assert.ok(rows.length >= 9, 'Primero cargar datos de demostración');
  if (process.argv[2] === 'capture') {
    await writeFile('/tmp/topwalker-persistence.json', snapshot);
    console.log(`Capturados ${rows.length} productos con variantes/fotografías, ${users.length} cuentas y ${files.length} archivos locales.`);
  } else if (process.argv[2] === 'verify') {
    assert.equal(snapshot, await readFile('/tmp/topwalker-persistence.json', 'utf8'));
    console.log('Persistencia verificada: productos, relaciones, cuentas y bytes de fotografías idénticos tras reiniciar los servicios.');
  } else throw new Error('Usar capture o verify');
} finally { await db.$disconnect(); }
