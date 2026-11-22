import type { Prisma } from '@prisma/client';
import type { PrismaService } from './prisma.service';

// Shared by the public catalog and the administrative list. Stored names stay intact.
export async function productNameFilter(db: PrismaService, query?: string): Promise<Prisma.ProductWhereInput> {
  if (!query?.trim()) return {};
  // Parameters remain bound; strpos treats %, _ and quotes as literal input.
  // NFC also handles names/searches entered with decomposed Unicode accents.
  const matches = await db.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Product"
    WHERE strpos(
      translate(lower(normalize("name", NFC)), 'áéíóúüñ', 'aeiouun'),
      translate(lower(normalize(${query.trim()}, NFC)), 'áéíóúüñ', 'aeiouun')
    ) > 0
  `;
  return { id: { in: matches.map(product => product.id) } };
}
