import type { Metadata } from 'next';
import { GeistMono, GeistSans } from 'geist/font';
import '@mountier/tier-trade-design-system/styles.css';
import './styles.css';

export const metadata: Metadata = {
  title: 'Tier Trade',
  description: 'Gestão operacional para trading agrícola',
  icons: {
    icon: {
      url: encodeURI('/favicon/Imagem do ChatGPT 1 de out. de 2026, 18_06_53-4.png'),
      type: 'image/png',
      sizes: '1254x1254',
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
