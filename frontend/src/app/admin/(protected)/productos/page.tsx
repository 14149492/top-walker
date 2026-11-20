import Link from 'next/link';
import { adminData } from '@/lib/admin-server';
import type { AdminProduct } from '@/lib/admin';
import { price } from '@/lib/catalog';
import { ProductPhoto } from '@/components/product-photo';
import { PublicationButton } from '@/components/admin/publication-button';
export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string }> }) {
  const search = await searchParams;
  const q = typeof search.q === 'string' ? search.q.slice(0, 100) : '';
  const products = await adminData<AdminProduct[]>(`admin/products?q=${encodeURIComponent(q)}`);
  return <section><div className="admin-title"><div><p className="eyebrow">GESTIÓN DEL CATÁLOGO</p><h1>Productos</h1></div><Link className="button" href="/admin/productos/nuevo">Nuevo producto</Link></div>
    {search.saved === '1' && <p className="form-success" role="status">Producto guardado correctamente.</p>}
    <form className="admin-search" action="/admin/productos"><label htmlFor="admin-search">Buscar modelo</label><div><input id="admin-search" name="q" type="search" defaultValue={q} placeholder="Nombre del modelo" maxLength={100} /><button className="button secondary">Buscar</button><Link href="/admin/productos" className="text-link">Limpiar</Link></div></form>
    <p className="result-count">{products.length} {products.length === 1 ? 'producto' : 'productos'} · publicados y retirados</p>
    <div className="admin-products">{products.map(product => <article className="admin-product" key={product.id}>
      <div className="admin-product-image"><ProductPhoto photo={product.photos[0]} /></div><div className="admin-product-details"><span className={`status-badge ${product.published ? 'is-published' : ''}`}>{product.published ? 'Publicado' : 'Retirado'}</span>{product.demo && <span className="admin-demo">Demostración</span>}<h2>{product.name}</h2><p>{product.category.name} · {price(product.price)}</p><p className="muted">{product.variants.filter(v => v.available).length} combinaciones disponibles</p></div>
      <div className="admin-row-actions"><Link className="button" href={`/admin/productos/${product.id}/editar`}>Editar</Link><PublicationButton id={product.id} published={product.published} version={product.version} />{product.published && <Link className="text-link" href={`/catalogo/${product.slug}`}>Ver ficha pública</Link>}</div>
    </article>)}</div>{!products.length && <p className="empty-state">No hay productos que coincidan. Puedes registrar un modelo nuevo.</p>}
  </section>;
}
