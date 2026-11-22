'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="contenido" className="shell empty-state"><h1>No pudimos cargar el catalogo</h1><p>El servicio no esta disponible en este momento. Intentalo de nuevo.</p><button className="button" onClick={reset}>Reintentar</button></main>;
}
