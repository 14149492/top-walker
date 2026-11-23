import { adminData, requireAdmin } from '@/lib/admin-server';
import { CategoryManager, type AdminCategory } from '@/components/admin/category-manager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Categorías | Top Walker', robots: { index: false, follow: false } };

export default async function AdminCategories() {
  await requireAdmin();
  const categories = await adminData<AdminCategory[]>('admin/categories');
  return <section className="admin-products">
    <div className="admin-heading">
      <div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Categorías</h1></div>
    </div>
    <CategoryManager initial={categories} />
  </section>;
}
