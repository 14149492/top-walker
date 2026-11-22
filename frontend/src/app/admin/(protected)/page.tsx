import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-server';
export default async function AdminHome() {
  await requireAdmin();
  return <section className="admin-welcome"><p className="eyebrow">TU CATALOGO, AL DIA</p><h1>Un espacio para<br /><em>cada nuevo modelo.</em></h1><p>Registra calzados, actualiza sus fotografias y manten la disponibilidad por talla y color.</p><div className="admin-actions"><Link className="button" href="/admin/productos/nuevo">Registrar producto</Link><Link className="button secondary" href="/admin/productos">Gestionar productos</Link></div><div className="admin-info"><h2>Publica cuando este listo</h2><p>Los productos retirados permanecen en tu panel. Puedes editarlos y volver a publicarlos en cualquier momento.</p></div></section>;
}
