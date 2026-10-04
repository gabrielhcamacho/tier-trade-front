import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOut } from './auth/actions';
import { BrandLogo } from './brand-logo';
import { ContextNav } from './context-nav';
import { PageSectionRail } from './page-section-rail';
import { hasSupabaseConfiguration } from '../lib/supabase/configuration';

type Domain = 'central' | 'commercial' | 'contracts' | 'operations' | 'inventory' | 'risk' | 'financial' | 'fiscal';

export function AppShell({
  activeDomain,
  userLabel,
  children,
}: {
  activeDomain: Domain;
  userLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <header className="domain-bar">
        <Link className="wordmark" href="/" aria-label="Tier Trade, início">
          <BrandLogo variant="light" />
        </Link>
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
          {hasSupabaseConfiguration() ? (
            <form action={signOut}><button type="submit">Sair</button></form>
          ) : null}
        </div>
      </header>

      {activeDomain === 'central' ? <ContextNav /> : null}

      <PageSectionRail />
      <main id="conteudo">{children}</main>
    </div>
  );
}
