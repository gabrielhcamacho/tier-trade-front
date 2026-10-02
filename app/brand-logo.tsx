import Image from 'next/image';

const logos = {
  light: '/images/tier-trade-light.png',
  dark: '/images/tier-trade-dark.png',
};

export function BrandLogo({ variant = 'dark' }: { variant?: keyof typeof logos }) {
  return <Image
    className="brand-logo"
    src={logos[variant]}
    alt="Tier Trade"
    width={2172}
    height={724}
    sizes={variant === 'light' ? '(max-width: 620px) 150px, 180px' : '240px'}
    preload
    unoptimized
  />;
}
