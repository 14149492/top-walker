export type AdminUser = { id: string; username: string; email: string; displayName: string };
export type AdminProduct = {
  id: string; slug: string; name: string; description: string; material: string; price: string;
  sole: string | null; insole: string | null; lining: string | null;
  categoryId: string; category: { id: string; name: string }; published: boolean; demo: boolean; version: number;
  variants: { id?: string; size: number; color: string; available: boolean }[];
  photos: { id?: string; assetId?: string | null; url: string; alt: string; position: number }[];
};
export type Category = { id: string; name: string };
export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options, credentials: 'same-origin', cache: 'no-store',
    headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), 'X-Topwalker-Request': '1', ...options.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // Clear cached administrative UI when the server invalidates the session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (response.status === 401 && !path.endsWith('login')) window.location.assign('/admin/login');
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    throw new Error(message || 'No se pudo completar la operacion. Intentalo de nuevo.');
  }
  return body;
}
