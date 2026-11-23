'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { adminRequest, type AdminProduct, type Category } from '@/lib/admin';
import { ProductPhoto } from '@/components/product-photo';

const subscribe = () => () => {};
type Variant = AdminProduct['variants'][number];
type Photo = AdminProduct['photos'][number];

export function ProductForm({ product, categories: initialCategories, provider }: {
  product?: AdminProduct; categories: Category[]; provider: string;
}) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>(product?.variants || [{ color: '', size: 40, available: true }]);
  const [photos, setPhotos] = useState<Photo[]>(product?.photos || []);
  const [categories, setCategories] = useState(initialCategories);
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [newCategory, setNewCategory] = useState('');
  const [pending, setPending] = useState(false), [uploading, setUploading] = useState(false), [addingCategory, setAddingCategory] = useState(false);
  const [error, setError] = useState('');
  const busy = pending || uploading || addingCategory;

  function changeVariant(index: number, patch: Partial<Variant>) {
    setVariants(current => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  }
  async function addCategory() {
    setAddingCategory(true); setError('');
    try {
      const result = await adminRequest<Category>('admin/categories', { method: 'POST', body: JSON.stringify({ name: newCategory }) });
      setCategories(current => current.some(c => c.id === result.id) ? current : [...current, result]);
      setCategoryId(result.id); setNewCategory('');
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo crear la categoria.'); }
    finally { setAddingCategory(false); }
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (photos.length + files.length > 8) { setError('Puedes añadir hasta 8 fotografias por modelo.'); return; }
    setUploading(true); setError('');
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Usa fotografias JPG, PNG o WebP de hasta 5 MB.');
        const body = new FormData(); body.append('file', file);
        const asset = await adminRequest<{ id: string; url: string }>('admin/media', { method: 'POST', body });
        setPhotos(current => [...current, { assetId: asset.id, url: asset.url, alt: product?.name || 'Fotografia del modelo', position: current.length }]);
      }
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cargar la imagen.'); }
    finally { setUploading(false); }
  }
  function makePrimary(index: number) {
    setPhotos(current => [current[index], ...current.filter((_, i) => i !== index)]);
  }
  function movePhoto(index: number, direction: number) {
    setPhotos(current => {
      const next = [...current];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const fields = new FormData(event.currentTarget);
    const price = String(fields.get('price') || '').trim().replace(',', '.');
    if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(price) || Number(price) <= 0) { setError('Ingresa un precio mayor que cero, con hasta dos decimales.'); return; }
    const keys = variants.map(v => `${v.size}:${v.color.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')}`);
    if (new Set(keys).size !== keys.length) { setError('Hay combinaciones de talla y color duplicadas.'); return; }
    if (!photos.length) { setError('Añade al menos una fotografia del modelo.'); return; }
    setPending(true);
    const body = {
      name: fields.get('name'), description: fields.get('description'), material: fields.get('material'), price, categoryId,
      sole: fields.get('sole'), insole: fields.get('insole'), lining: fields.get('lining'), details: fields.get('details'),
      published: fields.get('published') === 'on', demo: fields.get('demo') === 'on',
      variants: variants.map(v => ({ ...(v.id ? { id: v.id } : {}), size: v.size, color: v.color, available: v.available, availabilityConfirmed: v.availabilityConfirmed ?? true })),
      photos: photos.map(p => ({ ...(p.id ? { id: p.id } : {}), ...(p.assetId ? { assetId: p.assetId } : {}), alt: p.alt, color: p.color || null })),
      ...(product ? { version: product.version } : {}),
    };
    try {
      await adminRequest(product ? `admin/products/${product.id}` : 'admin/products', { method: product ? 'PUT' : 'POST', body: JSON.stringify(body) });
      router.push('/admin/productos?saved=1');
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar el producto.'); setPending(false); }
  }

  return <form className="admin-form product-form" onSubmit={save}>
    <fieldset disabled={!ready || busy} className="form-section"><legend>Informacion del modelo</legend><div className="form-grid">
      <label className="span-two">Nombre del modelo<input name="name" defaultValue={product?.name} required minLength={2} maxLength={120} placeholder="Ej. Casual 001" /></label>
      <label>Material<input name="material" defaultValue={product?.material} required minLength={2} maxLength={120} placeholder="Ej. 100% cuero liso" /></label>
      <label>Precio en Bs<input name="price" defaultValue={product?.price} required inputMode="decimal" placeholder="469.00" maxLength={11} /></label>
      <label>Categoria<select aria-label="Categoria" name="categoryId" value={categoryId} onChange={e => setCategoryId(e.target.value)} required><option value="">Selecciona una categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <div className="new-category"><label>Nueva categoria<input value={newCategory} onChange={e => setNewCategory(e.target.value)} maxLength={60} placeholder="Si no aparece en la lista" /></label><button className="button secondary" type="button" onClick={addCategory} disabled={newCategory.trim().length < 2}>Añadir categoria</button></div>
      <label className="span-two">Descripcion<textarea aria-label="Descripcion" name="description" defaultValue={product?.description} required minLength={10} maxLength={3000} rows={4} placeholder="Describe el diseño y las caracteristicas del calzado." /></label>
    </div></fieldset>

    <fieldset disabled={!ready || busy} className="form-section"><legend>Caracteristicas del calzado</legend><p className="section-help">Completa los datos que correspondan a este modelo. Los campos vacios no se mostraran en el catalogo.</p><div className="form-grid">
      <label className="span-two">Otros detalles<textarea name="details" defaultValue={product?.details || ''} maxLength={1000} rows={3} placeholder="Cordones, cierre, acabados..." /></label><label>Plantas<input name="sole" defaultValue={product?.sole || ''} maxLength={200} placeholder="Ej. Super ligeras antideslizantes" /></label>
      <label>Plantilla interna<input name="insole" defaultValue={product?.insole || ''} maxLength={200} placeholder="Ej. Piel de res y acolchado" /></label>
      <label className="span-two">Forro interno<input name="lining" defaultValue={product?.lining || ''} maxLength={200} placeholder="Ej. Piel de res badana" /></label>
    </div></fieldset>

    <fieldset disabled={!ready || busy} className="form-section"><legend>Tallas, colores y disponibilidad</legend><p className="section-help">Cada fila es una combinacion. Puedes indicar si esta disponible o agotada, sin registrar cantidades.</p>
      <div className="variant-list">{variants.map((variant, index) => <div className="variant-row" key={variant.id || `new-${index}`}>
        <label>Color {index + 1}<input value={variant.color} onChange={e => changeVariant(index, { color: e.target.value })} required maxLength={40} placeholder="Negro" /></label>
        <label>Talla {index + 1}<input type="number" value={variant.size || ''} onChange={e => changeVariant(index, { size: Number(e.target.value) })} min={1} max={60} step={1} required /></label>
        <label className="check-label"><input type="checkbox" checked={variant.available} onChange={e => changeVariant(index, { available: e.target.checked, availabilityConfirmed: true })} aria-label={`Disponible ${index + 1}`} /><span>{variant.availabilityConfirmed === false ? 'Por confirmar' : variant.available ? 'Disponible' : 'Agotado'}</span></label>
        <label className="check-label"><input type="checkbox" checked={variant.availabilityConfirmed !== false} onChange={e => changeVariant(index, { availabilityConfirmed: e.target.checked, ...(e.target.checked ? {} : { available: false }) })} aria-label={`Confirmada ${index + 1}`} /><span>Confirmada</span></label><button className="text-button" type="button" disabled={variants.length <= 1} onClick={() => setVariants(current => current.filter((_, i) => i !== index))} aria-label={`Quitar combinacion ${index + 1}`}>Quitar</button>
      </div>)}</div>
      <button className="button secondary" type="button" disabled={variants.length >= 120} onClick={() => setVariants(current => [...current, { color: '', size: 40, available: true }])}>Añadir combinacion</button>
    </fieldset>

    <fieldset id="fotografias" disabled={!ready || busy} className="form-section"><legend>Fotografias</legend><p className="section-help">Hasta 8 imagenes JPG, PNG o WebP de 5 MB. La primera sera la fotografia principal.</p>
      {provider === 'local' && <p className="storage-note">Modo de prueba local: las fotografias se conservan en este entorno.</p>}
      <label className="upload-label">Añadir fotografias<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={photos.length >= 8} /></label>
      <div className="photo-editor">{photos.map((photo, index) => <article className="photo-editor-card" key={photo.id || photo.assetId}>
        <div className="photo-editor-preview">{photo.url.startsWith('/demo/') ? <ProductPhoto photo={photo} /> : <Image src={photo.url} alt={photo.alt || 'Fotografia del modelo'} width={360} height={240} unoptimized />}</div>
        <span className="photo-order">{index === 0 ? 'Fotografia principal' : `Fotografia ${index + 1}`}</span>
        <label>Texto alternativo {index + 1}<input value={photo.alt} required maxLength={160} onChange={e => setPhotos(current => current.map((row, i) => i === index ? { ...row, alt: e.target.value } : row))} /></label>
        <label>Color de foto {index + 1}<input value={photo.color || ''} maxLength={40} onChange={e => setPhotos(current => current.map((row, i) => i === index ? { ...row, color: e.target.value } : row))} placeholder="Opcional" /></label><div className="photo-actions">{index > 0 && <button type="button" className="text-button" onClick={() => makePrimary(index)}>Hacer principal</button>}<button type="button" className="text-button" disabled={index === 0} onClick={() => movePhoto(index, -1)} aria-label={`Mover foto ${index + 1} antes`}>Antes</button><button type="button" className="text-button" disabled={index === photos.length - 1} onClick={() => movePhoto(index, 1)} aria-label={`Mover foto ${index + 1} despues`}>Despues</button><button type="button" className="text-button danger-text" onClick={() => { if (!photo.id && photo.assetId) adminRequest(`admin/media/${photo.assetId}`, { method: 'DELETE' }).catch(() => {}); setPhotos(current => current.filter((_, i) => i !== index)); }} aria-label={`Quitar foto ${index + 1}`}>Quitar</button></div>
      </article>)}</div>
    </fieldset>

    <fieldset disabled={!ready || busy} className="form-section publication-section"><legend>Publicacion</legend>
      <label className="check-label"><input type="checkbox" name="published" defaultChecked={product?.published || false} /><span>Publicar en el catalogo</span></label><p className="section-help">Si lo dejas sin marcar, el modelo se guardara retirado y podras publicarlo despues.</p>
      <label className="check-label"><input type="checkbox" name="demo" defaultChecked={product?.demo || false} /><span>Producto de demostracion</span></label><p className="section-help">Marca esta opcion si las fotografias o los datos son ilustrativos.</p>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
    {uploading && <p role="status">Cargando fotografias…</p>}
    <div className="form-footer"><Link className="text-link" href="/admin/productos">Volver a productos</Link><button className="button" type="submit" disabled={!ready || busy}>{pending ? 'Guardando…' : product ? 'Guardar cambios' : 'Guardar producto'}</button></div>
  </form>;
}
