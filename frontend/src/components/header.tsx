'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export function Header() {
  const pathname = usePathname();
  return <header className="site-header"><div className="shell header-inner">
    <Link className="brand" href="/" aria-label="Top Walker, inicio"><span className="brand-mark" aria-hidden="true">TW</span><span>Top Walker<small>CALZADOS · BOLIVIA</small></span></Link>
    <nav aria-label="Navegación principal"><Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Inicio</Link><Link href="/catalogo" aria-current={pathname.startsWith('/catalogo') ? 'page' : undefined}>Catálogo</Link><Link href="/#nosotros">Nosotros</Link><Link href="/contacto" aria-current={pathname === '/contacto' ? 'page' : undefined}>Contacto</Link></nav>
  </div></header>;
}
