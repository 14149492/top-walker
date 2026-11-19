import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Header } from '@/components/header';
export const metadata: Metadata = { title: 'Top Walker | Calzados de Bolivia', description: 'Descubre el catálogo de calzados Top Walker.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body><a className="skip-link" href="#contenido">Saltar al contenido</a><Header />{children}<footer className="footer"><div className="shell footer-inner"><Link className="footer-brand" href="/">Top Walker</Link><p>Calzados hechos en Bolivia.</p><Link href="/catalogo">Explorar catálogo</Link></div></footer></body></html>;
}
