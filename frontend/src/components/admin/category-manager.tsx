'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { adminRequest } from '@/lib/admin';

const subscribe = () => () => {};
export type AdminCategory = { id: string; name: string; _count?: { products: number } };

export function CategoryManager({ initial }: { initial: AdminCategory[] }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [newName, setNewName] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(initial.map(c => [c.id, c.name])));
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (newName.trim().length < 2) return;
    setBusyId('new'); setError(''); setNotice('');
    try {
      const created = await adminRequest<AdminCategory>('admin/categories', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setItems(cur => cur.some(c => c.id === created.id) ? cur : [...cur, { ...created, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name, 'es')));
      setDrafts(cur => ({ ...cur, [created.id]: created.name }));
      setNewName(''); setNotice('Categoría creada.'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear la categoría.'); }
    finally { setBusyId(''); }
  }

  async function rename(id: string) {
    const name = (drafts[id] || '').trim();
    if (name.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    setBusyId(id); setError(''); setNotice('');
    try {
      const updated = await adminRequest<AdminCategory>(`admin/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
      setItems(cur => cur.map(c => c.id === id ? { ...c, name: updated.name } : c).sort((a, b) => a.name.localeCompare(b.name, 'es')));
      setNotice('Categoría actualizada.'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar la categoría.'); }
    finally { setBusyId(''); }
  }

  async function remove(id: string) {
    setBusyId(id); setError(''); setNotice('');
    try {
      await adminRequest(`admin/categories/${id}`, { method: 'DELETE' });
      setItems(cur => cur.filter(c => c.id !== id));
      setNotice('Categoría eliminada.'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo eliminar la categoría.'); }
    finally { setBusyId(''); }
  }

  return <div className="admin-form">
    <form className="form-section" onSubmit={create}>
      <legend>Nueva categoría</legend>
      <div className="new-category">
        <label>Nombre<input value={newName} onChange={e => setNewName(e.target.value)} maxLength={60} placeholder="Ej. Mocasines" disabled={!ready || !!busyId} /></label>
        <button className="button" type="submit" disabled={!ready || !!busyId || newName.trim().length < 2}>Añadir categoría</button>
      </div>
    </form>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-success" role="status">{notice}</p>}
    <section className="form-section">
      <legend>Categorías registradas ({items.length})</legend>
      <div className="variant-list">
        {items.map(cat => {
          const count = cat._count?.products ?? 0;
          const busy = !ready || !!busyId;
          return <div className="variant-row" key={cat.id}>
            <label>Nombre<input value={drafts[cat.id] ?? cat.name} onChange={e => setDrafts(cur => ({ ...cur, [cat.id]: e.target.value }))} maxLength={60} disabled={busy} /></label>
            <span className="muted">{count} {count === 1 ? 'modelo' : 'modelos'}</span>
            <button type="button" className="button secondary" disabled={busy || (drafts[cat.id] ?? cat.name).trim() === cat.name} onClick={() => rename(cat.id)}>Guardar nombre</button>
            <button type="button" className="text-button danger-text" disabled={busy || count > 0} onClick={() => remove(cat.id)}>Eliminar</button>
          </div>;
        })}
      </div>
    </section>
  </div>;
}
