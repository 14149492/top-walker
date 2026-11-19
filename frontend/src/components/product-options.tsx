'use client';
import { useState, useSyncExternalStore } from 'react';
import type { Product } from '@/lib/catalog';
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function ProductOptions({ product, whatsapp, siteUrl }: { product: Product; whatsapp: string; siteUrl: string }) {
  const colors = [...new Set(product.variants.map(v => v.color))];
  const [color, setColor] = useState(colors[0] || '');
  const [size, setSize] = useState<number | null>(null);
  // Prevent a click before React has attached event handlers to the server HTML.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const variants = product.variants.filter(v => v.color === color), selected = variants.find(v => v.size === size);
  const message = `Hola, me interesa el modelo ${product.name}${color ? `, color ${color}` : ''}${size ? `, talla ${size}` : ''}. ${siteUrl}/catalogo/${product.slug}`;
  return <div className="product-options"><fieldset><legend>Color <span>{color}</span></legend><div className="option-list">{colors.map(c => <button className="option" key={c} disabled={!ready} aria-pressed={color === c} onClick={() => { setColor(c); setSize(null); }}>{c}</button>)}</div></fieldset><fieldset><legend>Talla</legend><div className="option-list">{variants.map(v => <button key={v.size} className="option size-option" disabled={!ready || !v.available} aria-pressed={size === v.size} title={v.available ? `Talla ${v.size} disponible en ${color}` : `Talla ${v.size} no disponible en ${color}`} onClick={() => setSize(v.size)}>{v.size}</button>)}</div></fieldset><p role="status" className="selection-status">{selected?.available ? `Disponible en ${color}, talla ${size}` : variants.some(v => v.available) ? 'Selecciona una talla disponible para este color.' : 'Este color no tiene tallas disponibles.'}</p>{whatsapp ? <a className="button contact-button" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a> : <p className="contact-pending">El contacto por WhatsApp estará disponible cuando Top Walker confirme su número.</p>}</div>;
}
