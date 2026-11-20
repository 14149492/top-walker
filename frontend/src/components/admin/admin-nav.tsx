'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { adminRequest } from '@/lib/admin';
const subscribe = () => () => {};
export function AdminNav() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const pathname = usePathname(), [error, setError] = useState(''), [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try {
      await adminRequest('auth/logout', { method: 'POST' });
      // Discard all in-memory administrative pages after revoking the session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/admin/login');
    }
    catch { setError('No se pudo cerrar la sesión. Inténtalo de nuevo.'); setPending(false); }
  }
  return <><nav className="admin-nav" aria-label="Administración">
    <Link href="/admin" aria-current={pathname === '/admin' ? 'page' : undefined}>Panel</Link>
    <Link href="/admin/productos" aria-current={pathname.startsWith('/admin/productos') ? 'page' : undefined}>Productos</Link>
    <Link href="/catalogo">Ver catálogo</Link>
    <button type="button" onClick={logout} disabled={!ready || pending}>{pending ? 'Cerrando…' : 'Cerrar sesión'}</button>
  </nav>{error && <p className="form-error" role="alert">{error}</p>}</>;
}
