import Image from 'next/image';

const logos = {
  light: '/images/logos/Imagem do ChatGPT 1 de out. de 2026, 18_06_53-3.png',
  dark: '/images/logos/Imagem do ChatGPT 1 de out. de 2026, 18_07_17.png',
};

export function BrandLogo({ variant = 'dark' }: { variant?: keyof typeof logos }) {
  return <Image
    className="brand-logo"
    src={encodeURI(logos[variant])}
    alt="Tier Trade"
    width={2172}
    height={724}
    sizes={variant === 'light' ? '(max-width: 620px) 150px, 180px' : '240px'}
    preload
  />;
}
