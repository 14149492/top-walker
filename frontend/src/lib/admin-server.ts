import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminUser } from './admin';
export async function adminFetch(path: string) {
  const jar = await cookies();
  const token = jar.get('topwalker_session');
  return fetch(`${process.env.API_INTERNAL_URL}/${path}`, {
    headers: token ? { Cookie: `topwalker_session=${token.value}` } : {},
    cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
}
export async function requireAdmin(): Promise<AdminUser> {
  const response = await adminFetch('auth/me');
  if (response.status === 401 || response.status === 403) redirect('/admin/login');
  if (!response.ok) throw new Error('El servicio administrativo no está disponible.');
  return response.json();
}
export async function adminData<T>(path: string): Promise<T> {
  const response = await adminFetch(path);
  if (response.status === 401 || response.status === 403) redirect('/admin/login');
  if (!response.ok) throw new Error('No se pudo consultar la información administrativa.');
  return response.json();
}
