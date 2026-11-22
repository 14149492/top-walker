import { notFound } from 'next/navigation';
import { adminData, adminFetch, requireAdmin } from '@/lib/admin-server';
import type { AdminProduct, Category } from '@/lib/admin';
import { ProductForm } from '@/components/admin/product-form';
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const response = await adminFetch(`admin/products/${encodeURIComponent(id)}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('No se pudo cargar el producto.');
  const product: AdminProduct = await response.json();
  const [categories, media] = await Promise.all([adminData<Category[]>('admin/categories'), adminData<{ provider: string }>('admin/media/config')]);
  return <section><div className="admin-title"><div><p className="eyebrow">MANTEN TU CATALOGO AL DIA</p><h1>Editar producto</h1><p className="muted">{product.name}</p></div></div><ProductForm product={product} categories={categories} provider={media.provider} /></section>;
}
