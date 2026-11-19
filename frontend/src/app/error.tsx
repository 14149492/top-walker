'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="contenido" className="shell empty-state"><h1>No pudimos cargar el catálogo</h1><p>El servicio no está disponible en este momento. Inténtalo de nuevo.</p><button className="button" onClick={reset}>Reintentar</button></main>;
}
