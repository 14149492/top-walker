import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CatalogQueryDto } from './catalog-query.dto';
import { productNameFilter } from '../database/product-search';

// Explicit projection: future administrative fields cannot leak into public responses.
const publicProduct = {
  id: true, slug: true, name: true, description: true, material: true, price: true, demo: true,
  sole: true, insole: true, lining: true, details: true,
  category: { select: { id: true, name: true } },
  photos: { orderBy: { position: 'asc' }, select: { url: true, alt: true, position: true, color: true } },
  variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }], select: { size: true, color: true, available: true, availabilityConfirmed: true } },
} satisfies Prisma.ProductSelect;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}
  async list(query: CatalogQueryDto) {
    return this.prisma.product.findMany({
      where: {
        published: true, deletedAt: null,
        ...await productNameFilter(this.prisma, query.q),
        ...(query.category ? { categoryId: query.category } : {}),
        ...(query.size ? { variants: { some: { size: query.size, available: true } } } : {}),
      },
      select: publicProduct,
      orderBy: [{ demo: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  }
  async detail(slug: string) {
    const product = await this.prisma.product.findFirst({ where: { slug, published: true, deletedAt: null }, select: publicProduct });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
  async filters() {
    const [categories, variants] = await Promise.all([
      this.prisma.category.findMany({ where: { products: { some: { published: true, deletedAt: null } } }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      this.prisma.variant.findMany({ where: { available: true, product: { published: true, deletedAt: null } }, select: { size: true }, distinct: ['size'], orderBy: { size: 'asc' } }),
    ]);
    return { categories, sizes: variants.map(variant => variant.size) };
  }
}
