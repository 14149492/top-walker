'use client';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore, useTransition } from 'react';
import { adminRequest } from '@/lib/admin';
const subscribe = () => () => {};
export function PublicationButton({ id, published, version }: { id: string; published: boolean; version: number }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [refreshing, startTransition] = useTransition();
  const router = useRouter(), [pending, setPending] = useState(false), [message, setMessage] = useState('');
  async function toggle() {
    setPending(true); setMessage('');
    try {
      await adminRequest(`admin/products/${id}/publication`, { method: 'PATCH', body: JSON.stringify({ published: !published, version }) });
      setMessage(published ? 'Producto retirado. Sus datos se conservan.' : 'Producto publicado.');
      startTransition(() => router.refresh());
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cambiar la publicación.'); }
    finally { setPending(false); }
  }
  return <div className="publication-control"><button className="button secondary" onClick={toggle} disabled={!ready || pending || refreshing} type="button">{pending || refreshing ? 'Guardando…' : published ? 'Retirar' : 'Publicar'}</button>{message && <p role="status">{message}</p>}</div>;
}
