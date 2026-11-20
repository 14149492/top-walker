'use client';
export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="shell empty-state"><h1>No pudimos cargar el panel</h1><p>Comprueba la conexión y vuelve a intentarlo.</p><button className="button" onClick={reset}>Reintentar</button></section>;
}
