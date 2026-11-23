import Link from 'next/link';
import { adminData } from '@/lib/admin-server';
import { ProductPhoto } from '@/components/product-photo';
import type { Product } from '@/lib/catalog';
type Photo = Product['photos'][number] | null;
type Rank = { id: string; name: string; photo: Photo; deletedAt: string | null; views: number; clicks: number; rate: number | null };
type Dimension = { productId: string; name: string; photo: Photo; value: string; selections: number; clicks: number };
type Summary = {
  from: string; to: string; totals: { views: number; clicks: number; sizeSelections: number; colorSelections: number };
  byViews: Rank[]; byClicks: Rank[]; sizes: Dimension[]; colors: Dimension[];
  daily: { date: string; views: number; clicks: number }[];
  variants: { productId: string; name: string; photo: Photo; size: number; color: string; clicks: number }[];
};
function StatsProduct({ name, photo }: { name: string; photo: Photo }) {
  return <div className="stats-product"><div className="stats-product-photo">{photo ? <ProductPhoto photo={photo} /> : <span className="stats-no-photo">Sin foto</span>}</div><span>{name}</span></div>;
}
function Rankings({ title, rows }: { title: string; rows: Rank[] }) {
  return <section className="stats-section"><h2>{title}</h2><div className="table-scroll"><table><thead><tr><th>Modelo</th><th>Vistas</th><th>Clics WhatsApp</th><th>Tasa de consulta</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><StatsProduct name={row.name} photo={row.photo} />{row.deletedAt && <small> · Eliminado</small>}</td><td>{row.views}</td><td>{row.clicks}</td><td>{row.rate === null ? 'Sin vistas' : `${row.rate} %`}</td></tr>)}</tbody></table></div>{!rows.length && <p className="muted">Sin interacciones en este periodo.</p>}</section>;
}
function Dimensions({ title, rows, label }: { title: string; rows: Dimension[]; label: string }) {
  return <section className="stats-section"><h2>{title}</h2><div className="table-scroll"><table><thead><tr><th>Modelo</th><th>{label}</th><th>Selecciones</th><th>Clics WhatsApp</th></tr></thead><tbody>{rows.map(row => <tr key={row.productId + row.value}><td><StatsProduct name={row.name} photo={row.photo} /></td><td>{row.value}</td><td>{row.selections}</td><td>{row.clicks}</td></tr>)}</tbody></table></div>{!rows.length && <p className="muted">Sin selecciones registradas.</p>}</section>;
}
export default async function Statistics({ searchParams }: { searchParams: Promise<{ days?: string; from?: string; to?: string }> }) {
  const search = await searchParams;
  const query = new URLSearchParams();
  if (typeof search.days === 'string' && ['7', '30', '90'].includes(search.days)) query.set('days', search.days);
  for (const key of ['from', 'to'] as const) if (typeof search[key] === 'string' && search[key]) query.set(key, search[key]);
  let stats: Summary;
  try { stats = await adminData<Summary>('admin/statistics?' + query); }
  catch { return <section className="stats-page"><h1>Estadisticas comerciales</h1><p role="alert">No se pudo cargar el informe. Revisa las fechas (maximo 366 dias) e intenta nuevamente.</p><Link className="button" href="/admin/estadisticas">Volver al informe</Link></section>; }
  const maximum = Math.max(1, ...stats.daily.map(row => row.views));
  return <section className="stats-page"><p className="eyebrow">INTERES EN EL CATALOGO</p><h1>Estadisticas comerciales</h1><p className="muted">Interacciones registradas, no ventas ni personas unicas. Los productos de demostracion no se incluyen.</p>
    <div className="stats-periods">{[7, 30, 90].map(days => <Link className="button secondary" key={days} href={`/admin/estadisticas?days=${days}`}>Ultimos {days} dias</Link>)}</div>
    <form className="stats-filters"><label>Desde<input type="date" name="from" defaultValue={stats.from} required /></label><label>Hasta<input type="date" name="to" defaultValue={stats.to} required /></label><button className="button">Aplicar fechas</button></form>
    <p className="muted">{stats.from} al {stats.to} · Hora de Bolivia (UTC-4)</p>
    <div className="stats-summary">{[['Vistas de fichas', stats.totals.views], ['Clics WhatsApp', stats.totals.clicks], ['Selecciones de talla', stats.totals.sizeSelections], ['Selecciones de color', stats.totals.colorSelections]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <section className="stats-section"><h2>Visitas por fecha</h2>{!stats.daily.length ? <p className="muted">Todavia no hay interacciones registradas en este periodo.</p> : <div className="daily-chart" role="img" aria-label="Visitas por fecha; los valores tambien aparecen junto a cada barra.">{stats.daily.map(day => <div key={day.date} className="daily-row"><span>{day.date}</span><div className="daily-track"><div style={{ width: `${day.views / maximum * 100}%` }} /></div><span>{day.views} vistas · {day.clicks} clics</span></div>)}</div>}</section>
    <Rankings title="Modelos mas visitados" rows={stats.byViews} /><Rankings title="Modelos mas consultados" rows={stats.byClicks} />
    <p className="muted">Tasa de consulta = clics a WhatsApp / vistas × 100. Puede superar el 100 % si una visita genera varias consultas distintas; no es una tasa de ventas.</p>
    <Dimensions title="Interes por talla" label="Talla" rows={stats.sizes} /><Dimensions title="Interes por color" label="Color" rows={stats.colors} />
    <section className="stats-section"><h2>Variantes con mas consultas</h2><div className="table-scroll"><table><thead><tr><th>Modelo</th><th>Color</th><th>Talla</th><th>Clics WhatsApp</th></tr></thead><tbody>{stats.variants.map(row => <tr key={row.productId + row.color + row.size}><td><StatsProduct name={row.name} photo={row.photo} /></td><td>{row.color}</td><td>{row.size}</td><td>{row.clicks}</td></tr>)}</tbody></table></div>{!stats.variants.length && <p className="muted">Sin consultas con talla y color seleccionados.</p>}</section>
    <p className="muted">Se conservan eventos durante 365 dias. Las selecciones indican interes y no confirman disponibilidad ni compra.</p>
  </section>;
}
