import Link from 'next/link';
import { ProductPhoto } from './product-photo';
import { price, type Product } from '@/lib/catalog';
export function ProductCard({ product, photo }: { product: Product; photo?: Product['photos'][number] }) {
  const image = photo || product.photos[0];
  const variants = photo?.color ? product.variants.filter(v => v.color === photo.color) : product.variants;
  const sizes = [...new Set(variants.filter(v => v.available).map(v => v.size))];
  const pending = variants.some(v => v.availabilityConfirmed === false);
  const href = `/catalogo/${product.slug}${photo ? `?foto=${photo.position}` : ''}`;
  return <article className="product-card">
    <Link href={href} className="photo-link" aria-label={`Ver ${product.name}${photo?.color ? `, ${photo.color}` : ''}`}><ProductPhoto photo={image} />{product.demo && <span className="demo-tag">Demostracion</span>}</Link>
    <div className="card-body"><p className="category-label">{product.category.name}</p><h3><Link href={href}>{product.name}</Link></h3>
      <p className="card-colors">{photo?.color || [...new Set(variants.map(v => v.color))].join(' · ')}</p>
      <div className="price-row"><span className="price">{price(product.price)}</span><span className={`availability ${sizes.length ? '' : 'unavailable'}`}>{sizes.length ? 'Disponible' : pending ? 'Consultar disponibilidad' : 'No disponible'}</span></div>
      <p className="size-summary">Tallas <span>{sizes.length ? sizes.join(' · ') : pending ? [...new Set(variants.map(v => v.size))].join(' · ') + ' (anunciadas)' : 'Sin tallas disponibles'}</span></p>
      <Link href={href} className="button card-button">Ver detalles</Link>
    </div>
  </article>;
}
