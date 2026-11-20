import { redirect } from 'next/navigation';
import { adminFetch } from '@/lib/admin-server';
import { BrandLogo } from '@/components/brand-logo';
import { LoginForm } from '@/components/admin/login-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Acceso administrativo | Top Walker', robots: { index: false, follow: false } };
export default async function Login() {
  const session = await adminFetch('auth/me');
  if (session.ok) redirect('/admin');
  return <main id="contenido" className="login-page shell"><section className="login-card">
    <BrandLogo /><p className="eyebrow">ESPACIO DE ADMINISTRACIÓN</p><h1>Bienvenido de nuevo</h1>
    <p className="muted">Ingresa con tu cuenta para mantener el catálogo de Top Walker.</p><LoginForm />
    <p className="login-note">Acceso exclusivo para el equipo de Top Walker.</p>
  </section><div className="login-story"><p className="eyebrow">HECHO EN BOLIVIA</p><h2>Cada modelo,<br /><em>con nuestra identidad.</em></h2><p>Producción y comercialización de calzados de cuero por manos bolivianas.</p></div></main>;
}
