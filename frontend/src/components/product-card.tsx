import Link from 'next/link';
import { ProductPhoto } from './product-photo';
import { price, type Product } from '@/lib/catalog';
export function ProductCard({ product }: { product: Product }) {
  const sizes = [...new Set(product.variants.filter(v => v.available).map(v => v.size))];
  return <article className="product-card"><Link href={`/catalogo/${product.slug}`} className="photo-link" aria-label={`Ver ${product.name}`}><ProductPhoto photo={product.photos[0]} />{product.demo && <span className="demo-tag">Demostracion</span>}</Link><div className="card-body"><p className="category-label">{product.category.name}</p><h3><Link href={`/catalogo/${product.slug}`}>{product.name}</Link></h3><div className="price-row"><span className="price">{price(product.price)}</span><span className={`availability ${sizes.length ? '' : 'unavailable'}`}>{sizes.length ? 'Disponible' : 'No disponible'}</span></div><p className="size-summary">Tallas <span>{sizes.length ? sizes.join(' · ') : 'Sin tallas disponibles'}</span></p><Link href={`/catalogo/${product.slug}`} className="button card-button">Ver detalles</Link></div></article>;
}
