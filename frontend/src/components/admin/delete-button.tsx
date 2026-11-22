'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminRequest } from '@/lib/admin';
export function DeleteButton({ id, name, version }: { id: string; name: string; version: number }) {
  const [confirming, setConfirming] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState('');
  const router = useRouter();
  async function remove() {
    setPending(true); setError('');
    try { await adminRequest(`admin/products/${id}`, { method: 'DELETE', body: JSON.stringify({ version }) }); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar.'); setPending(false); }
  }
  return <div className="delete-product">{!confirming ? <button type="button" className="text-button danger-text" onClick={() => setConfirming(true)}>Eliminar</button> : <div role="group" aria-label={`Confirmar eliminacion de ${name}`} className="delete-confirmation"><p>Eliminar {name} lo quitara del catalogo y del listado activo. Se conservaran sus datos, fotos y estadisticas. Para volver a publicarlo, usa Retirar en lugar de eliminar.</p><button className="button secondary" type="button" disabled={pending} onClick={() => setConfirming(false)}>Cancelar</button><button className="button" type="button" disabled={pending} onClick={remove}>{pending ? 'Eliminando...' : 'Confirmar eliminacion'}</button></div>}{error && <p role="alert" className="form-error">{error}</p>}</div>;
}
