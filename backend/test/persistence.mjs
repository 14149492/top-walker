import { PrismaClient } from '@prisma/client';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PrismaClient();
try {
  const rows = await db.product.findMany({ orderBy: { id: 'asc' }, include: { variants: { orderBy: { id: 'asc' } }, photos: { orderBy: { id: 'asc' } } } });
  const snapshot = JSON.stringify(rows);
  assert.ok(rows.length >= 9, 'Primero cargar datos de demostración');
  if (process.argv[2] === 'capture') {
    await writeFile('/tmp/topwalker-persistence.json', snapshot);
    console.log(`Capturados ${rows.length} productos con sus variantes y fotografías.`);
  } else if (process.argv[2] === 'verify') {
    assert.equal(snapshot, await readFile('/tmp/topwalker-persistence.json', 'utf8'));
    console.log('Persistencia verificada: registros idénticos tras recrear PostgreSQL.');
  } else throw new Error('Usar capture o verify');
} finally { await db.$disconnect(); }
