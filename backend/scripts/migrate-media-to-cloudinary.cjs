const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

async function main() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('Faltan credenciales de Cloudinary en las variables de entorno.');
  }

  const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
  const prisma = new PrismaClient();

  try {
    const locals = await prisma.mediaAsset.findMany({
      where: { provider: 'local' },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`Encontrados ${locals.length} archivos locales para migrar.`);

    let migrated = 0;
    let failed = 0;

    for (const asset of locals) {
      try {
        const filePath = join(uploadDir, asset.storageKey);
        const buffer = await readFile(filePath);
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              cloud_name,
              api_key,
              api_secret,
              resource_type: 'image',
              public_id: `topwalker/${asset.id}`,
              overwrite: true,
              timeout: 30000,
            },
            (err, res) => (err || !res ? reject(err || new Error('Sin respuesta de Cloudinary')) : resolve(res)),
          );
          stream.end(buffer);
        });

        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: {
            provider: 'cloudinary',
            storageKey: result.public_id,
            remoteUrl: result.secure_url,
          },
        });
        migrated++;
        console.log(`[${migrated}/${locals.length}] Migrado: ${asset.id} -> ${result.secure_url}`);
      } catch (err) {
        failed++;
        console.error(`Error migrando ${asset.id}:`, err.message || err);
      }
    }

    const totalCloud = await prisma.mediaAsset.count({ where: { provider: 'cloudinary' } });
    const totalLocal = await prisma.mediaAsset.count({ where: { provider: 'local' } });
    console.log(`Resumen -> Migrados: ${migrated}, Errores: ${failed}, Total Cloudinary: ${totalCloud}, Total Local restante: ${totalLocal}`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
