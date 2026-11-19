import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const examples = [
  ['oxford-ejecutivo', 'Oxford Ejecutivo', 'oxford', 'Oxford', 579, 'Negro'],
  ['modelo-andino', 'Modelo Andino', 'casual', 'Casual', 599, 'Marrón'],
  ['urbano-casual', 'Urbano Casual', 'urbano', 'Urbano', 469, 'Marrón'],
  ['botin-clasico', 'Botín Clásico', 'botin', 'Botín', 629, 'Marrón'],
  ['deportivo-urbano', 'Deportivo Urbano', 'deportivo', 'Deportivo', 549, 'Negro'],
  ['mocasin-premium', 'Mocasín Premium', 'mocasin', 'Mocasín', 489, 'Marrón'],
  ['botin-montana', 'Botín Montaña', 'botin', 'Botín', 699, 'Marrón'],
  ['clasico-blanco', 'Clásico Blanco', 'casual', 'Casual', 509, 'Blanco'],
] as const;

async function seed() {
  for (const [index, [slug, name, categoryId, categoryName, price, color]] of examples.entries()) {
    await prisma.category.upsert({ where: { id: categoryId }, update: {}, create: { id: categoryId, name: categoryName } });
    await prisma.product.upsert({
      where: { slug }, update: {},
      create: {
        id: `demo-${slug}`, slug, name, price, categoryId, published: true, demo: true,
        material: 'Cuero (dato demostrativo)',
        description: 'Modelo de demostración para explorar el catálogo. Las imágenes, el precio, los materiales y la disponibilidad son ilustrativos y no representan una oferta comercial de Top Walker.',
        photos: { create: [{ url: `/demo/catalog-reference.png#${index}`, alt: `${name}: imagen ilustrativa de la referencia visual`, position: 0 }] },
        variants: { create: [38, 39, 40, 41, 42, 43].map(size => ({ size, color, available: size !== 38 && (index !== 6 || size === 40) })) },
      },
    });
  }
  // A second color deliberately has different availability to exercise the agreed model.
  await prisma.variant.upsert({
    where: { productId_size_color: { productId: 'demo-urbano-casual', size: 38, color: 'Negro' } },
    update: {}, create: { productId: 'demo-urbano-casual', size: 38, color: 'Negro', available: true },
  });
  await prisma.product.upsert({
    where: { slug: 'modelo-retirado-demo' }, update: {},
    create: { id: 'demo-retirado', slug: 'modelo-retirado-demo', name: 'Modelo retirado de demostración', price: 450, material: 'Demostración', description: 'Registro retirado para verificar la privacidad del catálogo.', categoryId: 'casual', published: false, demo: true },
  });
  console.log('Datos demostrativos creados. Los registros existentes no se modificaron.');
}
seed().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
