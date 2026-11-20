import Image from 'next/image';
import { brand } from '@/lib/brand';
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`brand-identity ${compact ? 'compact' : ''}`}>
    <span className="brand-logo-frame"><Image src={brand.logo} alt="Logotipo Top Walker" width={brand.width} height={brand.height} priority /></span>
    <span className="brand-wordmark">{brand.name}<small>CUERO · MANOS BOLIVIANAS</small></span>
  </span>;
}
