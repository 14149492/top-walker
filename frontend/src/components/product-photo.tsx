import Image from 'next/image';
import type { Product } from '@/lib/catalog';
// CSS windows into the supplied mockup are only used for labelled demo products.
export function ProductPhoto({ photo, large = false }: { photo?: Product['photos'][number]; large?: boolean }) {
  if (!photo) return <div className="product-photo photo-empty">Fotografia pendiente</div>;
  const match = photo.url.match(/^\/demo\/catalog-reference\.png#([0-7])$/);
  if (match) {
    const index = Number(match[1]);
    const x = [397, 710, 1025, 1340][index % 4], y = index < 4 ? 361 : 641;
    return <div role="img" aria-label={photo.alt} className={`product-photo demo-photo ${large ? 'large' : ''}`} style={{ backgroundImage: 'url(/demo/catalog-reference.png)', backgroundSize: `${1672 / 289 * 100}% ${941 / 121 * 100}%`, backgroundPosition: `${x / (1672 - 289) * 100}% ${y / (941 - 121) * 100}%` }} />;
  }
  return <div className="product-photo"><Image src={photo.url} alt={photo.alt} fill sizes={large ? '(max-width: 768px) 100vw, 60vw' : '(max-width: 600px) 100vw, 33vw'} className="object-cover" unoptimized /></div>;
}
