'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { signOut } from './auth/actions';
import { BrandLogo } from './brand-logo';
import { ContextNav } from './context-nav';
import { hasSupabaseConfiguration } from '../lib/supabase/configuration';

type Domain = 'central' | 'commercial' | 'contracts' | 'operations' | 'inventory' | 'risk' | 'financial' | 'fiscal';

export const UserLabelContext = createContext<Dispatch<SetStateAction<string>> | null>(null);

function domainForPath(pathname: string): Domain {
  if (pathname.startsWith('/central') || pathname.startsWith('/demonstracao')) return 'central';
  if (pathname.startsWith('/contratos')) return 'contracts';
  if (pathname.startsWith('/cargas') || pathname.startsWith('/patio') || pathname.startsWith('/ocorrencias')) return 'operations';
  if (pathname.startsWith('/estoque')) return 'inventory';
  if (pathname.startsWith('/risco')) return 'risk';
  if (pathname.startsWith('/financeiro')) return 'financial';
  if (pathname.startsWith('/fiscal')) return 'fiscal';
  return 'commercial';
}

export function WorkspaceChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [userLabel, setUserLabel] = useState('Usuário');
  const publicPage = pathname === '/login' || pathname === '/update-password' || pathname.startsWith('/auth/');
  const activeDomain = domainForPath(pathname);

  useEffect(() => { if (publicPage) setUserLabel('Usuário'); }, [publicPage]);

  if (publicPage) return <>{children}</>;

  return (
    <UserLabelContext.Provider value={setUserLabel}>
      <div className="app-shell">
        <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
        <header className="domain-bar">
          <Link className="wordmark" href="/central" aria-label="Tier Trade, início"><BrandLogo variant="light" /></Link>
          <nav aria-label="Domínios">
            <Link className={activeDomain === 'central' ? 'active' : undefined} aria-current={activeDomain === 'central' ? 'page' : undefined} href="/central">Central</Link>
            <Link className={activeDomain === 'commercial' ? 'active' : undefined} aria-current={activeDomain === 'commercial' ? 'page' : undefined} href="/">Comercial</Link>
            <Link className={activeDomain === 'contracts' ? 'active' : undefined} aria-current={activeDomain === 'contracts' ? 'page' : undefined} href="/contratos">Contratos</Link>
            <Link className={activeDomain === 'operations' ? 'active' : undefined} aria-current={activeDomain === 'operations' ? 'page' : undefined} href="/cargas">Operações</Link>
            <Link className={activeDomain === 'inventory' ? 'active' : undefined} aria-current={activeDomain === 'inventory' ? 'page' : undefined} href="/estoque">Estoque</Link>
            <Link className={activeDomain === 'risk' ? 'active' : undefined} aria-current={activeDomain === 'risk' ? 'page' : undefined} href="/risco">Risco</Link>
            <Link className={activeDomain === 'financial' ? 'active' : undefined} aria-current={activeDomain === 'financial' ? 'page' : undefined} href="/financeiro">Financeiro</Link>
            <Link className={activeDomain === 'fiscal' ? 'active' : undefined} aria-current={activeDomain === 'fiscal' ? 'page' : undefined} href="/fiscal">Fiscal</Link>
          </nav>
          <div className="user-menu">
            <span className="user-avatar" aria-hidden="true">{userLabel.slice(0, 1).toUpperCase()}</span>
            <span className="user-label">{userLabel}</span>
            {hasSupabaseConfiguration() ? <form action={signOut}><button type="submit">Sair</button></form> : null}
          </div>
        </header>
        <ContextNav activeDomain={activeDomain} />
        <main id="conteudo">{children}</main>
      </div>
    </UserLabelContext.Provider>
  );
}
