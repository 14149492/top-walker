import { adminData } from '@/lib/admin-server';
import type { Category } from '@/lib/admin';
import { ProductForm } from '@/components/admin/product-form';
export default async function NewProduct() {
  const [categories, media] = await Promise.all([adminData<Category[]>('admin/categories'), adminData<{ provider: string }>('admin/media/config')]);
  return <section><div className="admin-title"><div><p className="eyebrow">AMPLIA TU COLECCION</p><h1>Nuevo producto</h1></div></div><ProductForm categories={categories} provider={media.provider} /></section>;
}
