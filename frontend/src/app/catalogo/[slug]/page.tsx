import Link from 'next/link';
import { notFound } from 'next/navigation';
import { price, type Product } from '@/lib/catalog';
import { ProductPhoto } from '@/components/product-photo';
import { ProductOptions } from '@/components/product-options';
export const dynamic = 'force-dynamic';
export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const response = await fetch(`${process.env.API_INTERNAL_URL}/catalog/products/${encodeURIComponent(slug)}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('No se pudo cargar el producto');
  const product: Product = await response.json();
  const number = process.env.WHATSAPP_NUMBER || '', whatsapp = /^\d{8,15}$/.test(number) ? number : '';
  return <main id="contenido" className="shell detail-page"><nav aria-label="Ruta de navegación" className="breadcrumbs"><Link href="/">Inicio</Link><span>/</span><Link href="/catalogo">Catálogo</Link><span>/</span><span>{product.name}</span></nav>{product.demo && <p className="demo-notice">Modelo de demostración. Los datos y las imágenes son ilustrativos; no representan una oferta comercial.</p>}<div className="detail-layout"><section className="gallery" aria-label="Fotografías del modelo">{product.photos.map(photo => <ProductPhoto key={photo.position} photo={photo} large />)}{!product.photos.length && <ProductPhoto />}</section><section className="detail-info"><p className="eyebrow">{product.category.name}</p><h1>{product.name}</h1><p className="detail-price">{price(product.price)}</p><p className="description">{product.description}</p><p className="material"><strong>Material</strong> {product.material}</p><ProductOptions product={product} whatsapp={whatsapp} siteUrl={process.env.PUBLIC_SITE_URL || 'http://localhost:3000'} /></section></div><Link className="text-link back-catalog" href="/catalogo">Volver al catálogo</Link></main>;
}
