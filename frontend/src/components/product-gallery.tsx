'use client';
import { useState } from 'react';
import type { Product } from '@/lib/catalog';
import { ProductPhoto } from './product-photo';
export function ProductGallery({ photos, initialPosition = 0 }: { photos: Product['photos']; initialPosition?: number }) {
  const [index, setIndex] = useState(() => Math.max(0, photos.findIndex(photo => photo.position === initialPosition)));
  return <section className="gallery" aria-label="Fotografias del modelo">
    <ProductPhoto photo={photos[index]} large />
    {photos[index]?.color && <p className="gallery-caption">{photos[index].color}</p>}
    {photos.length > 1 && <div className="gallery-thumbs">{photos.map((photo, i) => <button key={photo.position} type="button" aria-label={`Ver fotografia ${i + 1}: ${photo.color || photo.alt}`} aria-pressed={i === index} onClick={() => setIndex(i)}><ProductPhoto photo={photo} /></button>)}</div>}
  </section>;
}
