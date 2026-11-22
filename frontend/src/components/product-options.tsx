'use client';
import { useState, useSyncExternalStore } from 'react';
import type { Product } from '@/lib/catalog';
import { recordEvent } from '@/lib/events';
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function ProductOptions({ product, whatsapp, siteUrl }: { product: Product; whatsapp: string; siteUrl: string }) {
  const colors = [...new Set(product.variants.map(v => v.color))];
  const [color, setColor] = useState('');
  const [size, setSize] = useState<number | null>(null);
  // Prevent a click before React has attached event handlers to the server HTML.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const variants = product.variants.filter(v => v.color === color), selected = variants.find(v => v.size === size);
  const message = `Hola, me interesa el modelo ${product.name}${color ? `, color ${color}` : ''}${size ? `, talla ${size}` : ''}. Lo vi en el catalogo de Top Walker y quisiera consultar su disponibilidad. Referencia: ${siteUrl}/catalogo/${product.slug}`;
  return <div className="product-options"><fieldset><legend>Color <span>{color}</span></legend><div className="option-list">{colors.map(c => <button className="option" key={c} disabled={!ready} aria-pressed={color === c} onClick={() => { setColor(c); setSize(null); if (!product.demo && color !== c) recordEvent(product.id, 'COLOR_SELECT', { color: c }); }}>{c}</button>)}</div></fieldset><fieldset><legend>Talla</legend><div className="option-list">{variants.map(v => <button key={v.size} className="option size-option" disabled={!ready || (v.availabilityConfirmed && !v.available)} aria-pressed={size === v.size} title={!v.availabilityConfirmed ? 'Disponibilidad por confirmar' : v.available ? `Talla ${v.size} disponible en ${color}` : `Talla ${v.size} no disponible en ${color}`} onClick={() => { setSize(v.size); if (!product.demo && size !== v.size) recordEvent(product.id, 'SIZE_SELECT', { color, size: v.size }); }}>{v.size}</button>)}</div></fieldset><p role="status" className="selection-status">{!color ? 'Selecciona un color para ver sus tallas.' : selected && !selected.availabilityConfirmed ? `Disponibilidad por confirmar en ${color}, talla ${size}.` : selected?.available ? `Disponible en ${color}, talla ${size}` : variants.some(v => !v.availabilityConfirmed) ? 'Tallas anunciadas. Consulta la disponibilidad antes de comprar.' : variants.some(v => v.available) ? 'Selecciona una talla disponible para este color.' : 'Este color no tiene tallas disponibles.'}</p>{whatsapp ? <a className="button contact-button" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" onClick={() => { if (!product.demo) recordEvent(product.id, 'WHATSAPP_CLICK', { ...(color ? { color } : {}), ...(size ? { size } : {}) }); }}>Consultar por WhatsApp</a> : <p className="contact-pending">El contacto por WhatsApp estara disponible cuando Top Walker confirme su numero.</p>}</div>;
}
