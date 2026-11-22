import Link from 'next/link';
export const metadata = { title: 'Contacto | Top Walker' };
export const dynamic = 'force-dynamic';
export default function Contact() {
  const number = process.env.WHATSAPP_NUMBER || '';
  return <main id="contenido" className="shell contact-page"><p className="eyebrow">TOP WALKER · BOLIVIA</p><h1>Conversemos sobre<br /><em>tu proximo par.</em></h1><p>Encuentra el modelo que te interesa y revisa sus colores y tallas en el catalogo.</p>{/^\d{8,15}$/.test(number) ? <a href={`https://wa.me/${number}?text=${encodeURIComponent('Hola, quisiera consultar sobre los calzados Top Walker.')}`} className="button" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a> : <p className="contact-pending">El canal de WhatsApp se habilitara cuando el negocio confirme su numero de contacto.</p>}<Link className="text-link" href="/catalogo">Explorar el catalogo</Link></main>;
}
