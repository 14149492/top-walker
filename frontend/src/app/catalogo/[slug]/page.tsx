import Link from 'next/link';
import { notFound } from 'next/navigation';
import { price, type Product } from '@/lib/catalog';
import { ProductGallery } from '@/components/product-gallery';
import { ProductView } from '@/components/product-view';
import { ProductOptions } from '@/components/product-options';
import { ProductCharacteristics } from '@/components/product-characteristics';
export const dynamic = 'force-dynamic';
export default async function Detail({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ foto?: string }> }) {
  const { slug } = await params;
  const response = await fetch(`${process.env.API_INTERNAL_URL}/catalog/products/${encodeURIComponent(slug)}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('No se pudo cargar el producto');
  const product: Product = await response.json();
  const search = await searchParams;
  const selectedPhoto = product.photos.find(photo => String(photo.position) === search.foto)?.position || 0;
  const number = process.env.WHATSAPP_NUMBER || '', whatsapp = /^\d{8,15}$/.test(number) ? number : '';
  return <main id="contenido" className="shell detail-page"><nav aria-label="Ruta de navegacion" className="breadcrumbs"><Link href="/">Inicio</Link><span>/</span><Link href="/catalogo">Catalogo</Link><span>/</span><span>{product.name}</span></nav>{product.demo && <p className="demo-notice">Modelo de demostracion. Los datos y las imagenes son ilustrativos; no representan una oferta comercial.</p>}<div className="detail-layout"><ProductGallery key={`${product.id}:${selectedPhoto}`} photos={product.photos} initialPosition={selectedPhoto} /><ProductView id={product.id} demo={product.demo} /><section className="detail-info"><p className="eyebrow">{product.category.name}</p><h1>{product.name}</h1><p className="detail-price">{price(product.price)}</p><p className="description">{product.description}</p><ProductCharacteristics product={product} /><ProductOptions product={product} whatsapp={whatsapp} siteUrl={process.env.PUBLIC_SITE_URL || 'http://localhost:3000'} /></section></div><Link className="text-link back-catalog" href="/catalogo">Volver al catalogo</Link></main>;
}
