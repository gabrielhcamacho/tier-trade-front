import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOut } from './auth/actions';
import { BrandLogo } from './brand-logo';
import { hasSupabaseConfiguration } from '../lib/supabase/configuration';

type Domain = 'central' | 'commercial' | 'contracts' | 'operations' | 'financial';

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
          <span aria-disabled="true">Estoque</span>
          <span aria-disabled="true">Risco</span>
          <Link className={activeDomain === 'financial' ? 'active' : undefined} aria-current={activeDomain === 'financial' ? 'page' : undefined} href="/financeiro/liquidacoes/LQ-2026-01877">Financeiro</Link>
        </nav>
        <div className="user-menu">
          <span className="user-avatar" aria-hidden="true">{userLabel.slice(0, 1).toUpperCase()}</span>
          <span className="user-label">{userLabel}</span>
          {hasSupabaseConfiguration() ? (
            <form action={signOut}><button type="submit">Sair</button></form>
          ) : null}
        </div>
      </header>

      {activeDomain === 'central' ? (
        <nav className="context-bar" aria-label="Central">
          <Link className="active" aria-current="page" href="/central">Minha fila</Link>
          <Link href="/central#aprovacoes">Aprovações</Link>
          <Link href="/central#alertas">Alertas</Link>
          <span aria-disabled="true">Pesquisa global</span>
        </nav>
      ) : activeDomain === 'commercial' ? (
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
      ) : activeDomain === 'operations' ? (
        <nav className="context-bar" aria-label="Operações">
          <Link className="active" aria-current="page" href="/cargas">Agenda</Link>
          <span aria-disabled="true">Cargas</span>
          <span aria-disabled="true">Recebimento</span>
          <span aria-disabled="true">Qualidade</span>
          <span aria-disabled="true">Ocorrências</span>
        </nav>
      ) : (
        <nav className="context-bar" aria-label="Financeiro">
          <Link className="active" aria-current="page" href="/financeiro/liquidacoes/LQ-2026-01877">Liquidações</Link>
          <span aria-disabled="true">Contas a pagar</span>
          <span aria-disabled="true">Contas a receber</span>
          <span aria-disabled="true">Conciliação</span>
          <span aria-disabled="true">Fluxo de caixa</span>
        </nav>
      )}

      <main id="conteudo">{children}</main>
    </div>
  );
}
