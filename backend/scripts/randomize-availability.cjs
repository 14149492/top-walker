const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null, demo: false },
      include: { variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] } },
    });

    let totalGroups = 0;
    let totalAvailable = 0;
    let totalUnavailable = 0;

    for (const product of products) {
      const byColor = new Map();
      for (const v of product.variants) {
        if (!byColor.has(v.color)) byColor.set(v.color, []);
        byColor.get(v.color).push(v);
      }

      for (const [color, list] of byColor.entries()) {
        totalGroups++;
        const maxPick = Math.min(4, list.length);
        const minPick = Math.min(1, list.length);
        const count = minPick + Math.floor(Math.random() * (maxPick - minPick + 1));

        // Fisher-Yates shuffle indices
        const indices = list.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const chosen = new Set(indices.slice(0, count));

        await prisma.$transaction(
          list.map((variant, idx) =>
            prisma.variant.update({
              where: { id: variant.id },
              data: {
                available: chosen.has(idx),
                availabilityConfirmed: true,
              },
            }),
          ),
        );

        const availSizes = list.filter((_, idx) => chosen.has(idx)).map((v) => v.size);
        totalAvailable += availSizes.length;
        totalUnavailable += list.length - availSizes.length;
        console.log(`${product.name} (${color}): ${availSizes.length} disponibles [${availSizes.join(', ')}] de ${list.length}`);
      }
    }

    console.log(`Listo -> Grupos: ${totalGroups}, Disponibles: ${totalAvailable}, Agotados: ${totalUnavailable}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
