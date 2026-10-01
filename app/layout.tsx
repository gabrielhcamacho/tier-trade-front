import type { Metadata } from 'next';
import { GeistMono, GeistSans } from 'geist/font';
import '@mountier/tier-trade-design-system/styles.css';
import './styles.css';

export const metadata: Metadata = {
  title: 'Tier Trade',
  description: 'Gestão operacional para trading agrícola',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
