import Image from 'next/image';
import { brandAssets } from './brand-assets';

const logos = {
  light: brandAssets.wordmarkOnDark,
  dark: brandAssets.wordmarkOnLight,
};

export function BrandLogo({ variant = 'dark' }: { variant?: keyof typeof logos }) {
  return <Image
    className="brand-logo"
    src={logos[variant].split('/').map(encodeURIComponent).join('/')}
    alt="Tier Trade"
    width={2172}
    height={724}
    sizes={variant === 'light' ? '(max-width: 620px) 150px, 180px' : '240px'}
    preload
    unoptimized
  />;
}
