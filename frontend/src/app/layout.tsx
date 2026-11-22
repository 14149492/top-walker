import type { Metadata } from 'next';
import './globals.css';
import './admin.css';
import './theme.css';
import './commercial.css';
import './reference.css';
import Link from 'next/link';
import { Header } from '@/components/header';
import { brand } from '@/lib/brand';
export const metadata: Metadata = { title: 'Top Walker | Calzados de Bolivia', description: brand.description, icons: { icon: '/brand/favicon.png' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body><a className="skip-link" href="#contenido">Saltar al contenido</a><Header />{children}<footer className="footer"><div className="shell footer-inner"><Link className="footer-brand" href="/">Top Walker</Link><p>{brand.description}</p><Link href="/privacidad">Privacidad</Link></div></footer></body></html>;
}
