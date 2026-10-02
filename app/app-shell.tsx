import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOut } from './auth/actions';
import { BrandLogo } from './brand-logo';
import { hasSupabaseConfiguration } from '../lib/supabase/configuration';

type Domain = 'commercial' | 'contracts' | 'operations';

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
          <span aria-disabled="true">Central</span>
          <Link className={activeDomain === 'commercial' ? 'active' : undefined} aria-current={activeDomain === 'commercial' ? 'page' : undefined} href="/">Comercial</Link>
          <Link className={activeDomain === 'contracts' ? 'active' : undefined} aria-current={activeDomain === 'contracts' ? 'page' : undefined} href="/contratos">Contratos</Link>
          <Link className={activeDomain === 'operations' ? 'active' : undefined} aria-current={activeDomain === 'operations' ? 'page' : undefined} href="/cargas">Operações</Link>
          <span aria-disabled="true">Estoque</span>
          <span aria-disabled="true">Risco</span>
        </nav>
        <div className="user-menu">
          <span className="user-avatar" aria-hidden="true">{userLabel.slice(0, 1).toUpperCase()}</span>
          <span className="user-label">{userLabel}</span>
          {hasSupabaseConfiguration() ? (
            <form action={signOut}><button type="submit">Sair</button></form>
          ) : null}
        </div>
      </header>

      {activeDomain === 'commercial' ? (
        <nav className="context-bar" aria-label="Comercial">
          <Link className="active" aria-current="page" href="/#nova-oferta">Ofertas</Link>
          <Link href="/#politica-margem">Política de margem</Link>
          <span aria-disabled="true">Negociações</span>
          <span aria-disabled="true">Formação de preço</span>
          <span aria-disabled="true">Confirmações</span>
        </nav>
      ) : activeDomain === 'contracts' ? (
        <nav className="context-bar" aria-label="Contratos">
          <Link className="active" aria-current="page" href="/contratos">Contratos</Link>
          <span aria-disabled="true">Obrigações</span>
          <span aria-disabled="true">Documentos</span>
          <span aria-disabled="true">Auditoria</span>
        </nav>
      ) : (
        <nav className="context-bar" aria-label="Operações">
          <Link className="active" aria-current="page" href="/cargas">Agenda</Link>
          <span aria-disabled="true">Cargas</span>
          <span aria-disabled="true">Recebimento</span>
          <span aria-disabled="true">Qualidade</span>
          <span aria-disabled="true">Ocorrências</span>
        </nav>
      )}

      <main id="conteudo">{children}</main>
    </div>
  );
}
