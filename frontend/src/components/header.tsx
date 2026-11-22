'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './brand-logo';
export function Header() {
  const pathname = usePathname();
  return <header className="site-header"><div className="shell header-inner">
    <Link className="brand" href="/" aria-label="Top Walker, inicio"><BrandLogo /></Link>
    <nav aria-label="Navegacion principal"><Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Inicio</Link><Link href="/catalogo" aria-current={pathname.startsWith('/catalogo') ? 'page' : undefined}>Catalogo</Link><Link href="/#nosotros">Nosotros</Link><Link href="/contacto" aria-current={pathname === '/contacto' ? 'page' : undefined}>Contacto</Link></nav>
  </div></header>;
}
