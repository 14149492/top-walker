import { requireAdmin } from '@/lib/admin-server';
import { AdminNav } from '@/components/admin/admin-nav';
import { BrandLogo } from '@/components/brand-logo';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administración | Top Walker', robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <main id="contenido" className="shell admin-shell"><div className="admin-heading"><BrandLogo compact /><div><p className="eyebrow">ADMINISTRACIÓN</p><p>Hola, <strong>{user.displayName}</strong></p></div></div><AdminNav />{children}</main>;
}
