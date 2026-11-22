import type { Product } from '@/lib/catalog';

export function ProductCharacteristics({ product }: { product: Product }) {
  const sizes = [...new Set(product.variants.map(variant => variant.size))].sort((a, b) => a - b);
  const characteristics = [
    ['Material', product.material],
    ['Plantas', product.sole],
    ['Plantilla interna', product.insole],
    ['Forro interno', product.lining],
    ['Otros detalles', product.details],
    ['Tallas anunciadas', sizes.join(', ')],
  ].filter(([, value]) => value?.trim());

  return <section className="product-characteristics" aria-label="Caracteristicas del calzado">
    <h2>Caracteristicas</h2>
    <dl>{characteristics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </section>;
}
