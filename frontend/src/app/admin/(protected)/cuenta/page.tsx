import { requireAdmin } from '@/lib/admin-server';
import { PasswordForm } from '@/components/admin/password-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi cuenta | Top Walker', robots: { index: false, follow: false } };

export default async function AdminAccount() {
  const user = await requireAdmin();
  return <section className="admin-products">
    <div className="admin-heading">
      <div><p className="eyebrow">CUENTA ADMINISTRATIVA</p><h1>{user.displayName}</h1><p className="muted">{user.email} · @{user.username}</p></div>
    </div>
    <PasswordForm />
  </section>;
}
