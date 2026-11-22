import { api, type Filters, type Product } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';
import { CatalogFilters } from '@/components/catalog-filters';
import Link from 'next/link';
export const metadata = { title: 'Catalogo | Top Walker' };
export const dynamic = 'force-dynamic';
export default async function Catalog({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const text = (key: string) => typeof search[key] === 'string' ? search[key] as string : '';
  const q = text('q').slice(0, 100), category = text('category').slice(0, 80), rawSize = text('size');
  const size = /^\d+$/.test(rawSize) && Number(rawSize) >= 1 && Number(rawSize) <= 60 ? rawSize : '';
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  if (size) query.set('size', size);
  const [products, filters] = await Promise.all([api<Product[]>(`/catalog/products?${query}`), api<Filters>('/catalog/filters')]);
  const cards = products.flatMap<{ product: Product; photo?: Product['photos'][number] }>(product => {
    const photos = product.photos.filter(photo => !size || !photo.color || product.variants.some(v => v.color === photo.color && v.size === Number(size) && v.available));
    return photos.length ? photos.map(photo => ({ product, photo })) : [{ product, photo: undefined }];
  });
  return <main id="contenido"><section className="catalog-hero"><div className="hero-art" /><div className="shell"><p className="eyebrow">ENCUENTRA TU PROXIMO PAR</p><h1>Catalogo <em>Top Walker</em></h1><p>Diseño con caracter. Descubre el modelo que va contigo.</p></div></section><div className="shell catalog-layout"><aside><CatalogFilters key={`${q}-${category}-${size}`} filters={filters} q={q} category={category} size={size} /></aside><section aria-label="Resultados del catalogo"><div className="results-heading"><h2>{cards.length} {cards.length === 1 ? 'presentacion' : 'presentaciones'} de {products.length} {products.length === 1 ? 'modelo' : 'modelos'}</h2>{(q || category || size) && <span>Filtros aplicados</span>}</div>{products.some(p => p.demo) && <p className="demo-notice">Demostracion: imagenes, precios y disponibilidad ilustrativos.</p>}{products.length ? <div className="product-grid catalog-grid">{cards.map(({ product, photo }) => <ProductCard key={`${product.id}:${photo?.position ?? 0}`} product={product} photo={photo} />)}</div> : <div className="empty-state"><h3>No encontramos modelos</h3><p>Prueba otro nombre, categoria o talla.</p><Link className="button" href="/catalogo">Limpiar filtros</Link></div>}</section></div></main>;
}
