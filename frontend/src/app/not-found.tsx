import Link from 'next/link';
export default function NotFound() {
  return <main id="contenido" className="shell empty-state"><p className="eyebrow">TOP WALKER</p><h1>Pagina no disponible</h1><p>El modelo no existe o ya no esta publicado.</p><Link href="/catalogo" className="button">Volver al catalogo</Link></main>;
}
