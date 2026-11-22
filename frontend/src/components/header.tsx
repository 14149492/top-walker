'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { brand } from '@/lib/brand';
export function Header() {
  const pathname = usePathname();
  return <header className="site-header"><div className="shell header-inner">
    <div className="brand"><Link href="/admin" aria-label="Acceso al panel Top Walker" className="brand-logo-frame"><Image src={brand.logo} alt="Logotipo Top Walker" width={brand.width} height={brand.height} priority /></Link><Link href="/" aria-label="Top Walker, inicio" className="brand-wordmark">Top Walker<small>CUERO · MANOS BOLIVIANAS</small></Link></div>
    <nav aria-label="Navegacion principal"><Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Inicio</Link><Link href="/catalogo" aria-current={pathname.startsWith('/catalogo') ? 'page' : undefined}>Catalogo</Link><Link href="/#nosotros">Nosotros</Link><Link href="/contacto" aria-current={pathname === '/contacto' ? 'page' : undefined}>Contacto</Link></nav>
  </div></header>;
}
