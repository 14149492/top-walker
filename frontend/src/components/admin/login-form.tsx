'use client';
import { useState, useSyncExternalStore } from 'react';
import { adminRequest } from '@/lib/admin';
const subscribe = () => () => {};
export function LoginForm() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      await adminRequest('auth/login', { method: 'POST', body: JSON.stringify({ identifier: data.get('identifier'), password: data.get('password') }) });
      // A document navigation drops cached anonymous server components after setting the session cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/admin');
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo iniciar sesion.'); setPending(false); }
  }
  return <form className="admin-form login-form" onSubmit={login}>
    <label>Correo o usuario<input name="identifier" autoComplete="username" required maxLength={254} autoCapitalize="none" /></label>
    <label>Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={!ready || pending} type="submit">{pending ? 'Ingresando…' : 'Iniciar sesion'}</button>
  </form>;
}
