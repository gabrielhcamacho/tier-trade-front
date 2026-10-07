import type { Metadata } from 'next';
import { GeistMono, GeistSans } from 'geist/font';
import '@mountier/tier-trade-design-system/styles.css';
import './styles.css';
import { brandAssets } from './brand-assets';
import { NavigationProgress } from './navigation-progress';
import { WorkspaceChrome } from './workspace-chrome';
import { ClickableRowNavigation } from './clickable-row-navigation';

export const metadata: Metadata = {
  title: 'Tier Trade',
  description: 'Gestão operacional para trading agrícola',
  icons: {
    icon: {
      url: encodeURI(brandAssets.favicon),
      type: 'image/png',
      sizes: '1254x1254',
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}><NavigationProgress /><ClickableRowNavigation /><WorkspaceChrome>{children}</WorkspaceChrome></body>
    </html>
  );
}
