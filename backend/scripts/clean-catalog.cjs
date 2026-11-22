// One-time cleanup requested by the owner. Dry-run by default; originals are untouched.
// Run only while administrative edits/uploads are paused. Backup contains no credentials.
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const db = new PrismaClient();
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const root = path.resolve(process.env.UPLOAD_DIR || '/app/uploads');
const safeFile = name => {
  if (path.basename(name) !== name || !/^[a-zA-Z0-9-]+\.webp$/.test(name)) throw new Error('Unsafe local image path');
  return path.join(root, name);
};
async function snapshot(tx) {
  return {
    products: await tx.product.findMany({ orderBy: { id: 'asc' }, include: { variants: { orderBy: { id: 'asc' } }, photos: { orderBy: { id: 'asc' } } } }),
    assets: await tx.mediaAsset.findMany({ orderBy: { id: 'asc' } }),
  };
}
async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(__dirname, '../catalog/manifest.json'), 'utf8'));
  const keys = manifest.products.map(p => `zapatos1:${p.key}`);
  const keepAssets = new Set(manifest.products.flatMap(p => p.photos.map(photo => `import-${photo.sha256}`)));
  if (keys.length !== 12 || keepAssets.size !== 25) throw new Error('Expected the reviewed 12 models / 25 photographs');
  const before = await snapshot(db);
  const keepProducts = before.products.filter(p => keys.includes(p.importKey));
  if (keepProducts.length !== 12 || keepProducts.some(p => p.deletedAt)) throw new Error('Missing or deleted business models; aborting');
  const keepPhotos = keepProducts.flatMap(p => p.photos.filter(photo => keepAssets.has(photo.assetId)));
  if (keepPhotos.length !== 25 || new Set(keepPhotos.map(p => p.assetId)).size !== 25) throw new Error('Business photo references do not match the manifest');
  for (const product of manifest.products) {
    const current = keepProducts.find(p => p.importKey === `zapatos1:${product.key}`);
    if (!product.photos.every(photo => current.photos.some(p => p.assetId === `import-${photo.sha256}`))) throw new Error('Photo belongs to the wrong business model');
  }
  const preservedAssets = before.assets.filter(asset => keepAssets.has(asset.id));
  if (preservedAssets.length !== 25 || preservedAssets.some(asset => asset.provider !== 'local')) throw new Error('Expected 25 local business assets');
  const preservedFiles = new Set(preservedAssets.map(asset => asset.storageKey));
  const fileHashes = {};
  for (const file of preservedFiles) fileHashes[file] = digest(await fs.readFile(safeFile(file)));
  const keepPhotoIds = new Set(keepPhotos.map(p => p.id));
  const removedPhotos = before.products.flatMap(p => p.photos).filter(p => !keepPhotoIds.has(p.id));
  const removedAssets = before.assets.filter(asset => !keepAssets.has(asset.id));
  if (removedAssets.some(asset => asset.provider !== 'local')) throw new Error('Remote assets require a separate reviewed cleanup');
  const archived = before.products.filter(p => !keys.includes(p.importKey) && !p.deletedAt);
  const files = (await fs.readdir(root, { withFileTypes: true })).filter(entry => entry.isFile() && entry.name.endsWith('.webp') && !preservedFiles.has(entry.name)).map(entry => entry.name);
  files.forEach(safeFile);
  const plan = { businessModels: 12, preservedPhotos: 25, removePhotoReferences: removedPhotos.length, removeAssets: removedAssets.length, removeLocalFiles: files.length, archiveProducts: archived.map(p => ({ id: p.id, name: p.name, demo: p.demo })) };
  console.log(JSON.stringify(plan, null, 2));
  if (!process.argv.includes('--apply')) return;
  if (!removedPhotos.length && !removedAssets.length && !files.length && !archived.length) { console.log('Already clean'); return; }
  const backup = path.join(root, '.catalog-cleanup', new Date().toISOString().replace(/[:.]/g, '-'));
  await fs.mkdir(path.join(backup, 'files'), { recursive: true, mode: 0o700 });
  await fs.writeFile(path.join(backup, 'snapshot.json'), JSON.stringify({ ...before, plan }, null, 2), { flag: 'wx', mode: 0o600 });
  for (const file of files) {
    await fs.copyFile(safeFile(file), path.join(backup, 'files', file));
    if (digest(await fs.readFile(safeFile(file))) !== digest(await fs.readFile(path.join(backup, 'files', file)))) throw new Error('Backup verification failed');
  }
  const businessBefore = digest(keepProducts.map(p => ({ ...p, photos: p.photos.filter(photo => keepPhotoIds.has(photo.id)) })));
  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe('LOCK TABLE "Product", "Variant", "Photo", "MediaAsset" IN SHARE ROW EXCLUSIVE MODE');
    if (digest(await snapshot(tx)) !== digest(before)) throw new Error('Catalog changed during backup; aborting');
    await tx.photo.deleteMany({ where: { id: { in: removedPhotos.map(photo => photo.id) } } });
    await tx.product.updateMany({ where: { id: { in: archived.map(p => p.id) }, deletedAt: null }, data: { published: false, deletedAt: new Date(), version: { increment: 1 } } });
    await tx.mediaAsset.deleteMany({ where: { id: { in: removedAssets.map(asset => asset.id) } } });
  }, { timeout: 20000 });
  for (const file of files) await fs.unlink(safeFile(file));
  const after = await snapshot(db);
  if (digest(after.products.filter(p => keys.includes(p.importKey))) !== businessBefore) throw new Error('Business data changed unexpectedly');
  for (const file of preservedFiles) if (digest(await fs.readFile(safeFile(file))) !== fileHashes[file]) throw new Error('Business image changed unexpectedly');
  if (after.assets.length !== 25 || after.products.flatMap(p => p.photos).length !== 25) throw new Error('Unexpected remaining photo count');
  console.log(JSON.stringify({ cleaned: true, businessDataUnchanged: true, businessImagesUnchanged: true, backup, remainingPhotos: 25, remainingAssets: 25 }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
