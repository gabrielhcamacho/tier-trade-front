import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOut } from './auth/actions';
import { BrandLogo } from './brand-logo';
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

      {activeDomain === 'central' ? (
        <nav className="context-bar" aria-label="Central">
          <Link className="active" aria-current="page" href="/central">Minha fila</Link>
          <Link href="/central#aprovacoes">Aprovações</Link>
          <Link href="/central#alertas">Alertas</Link>
          <Link href="/demonstracao">Roteiro de demonstração</Link>
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
          <Link href="/contratos#obrigacoes">Obrigações</Link>
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
      ) : activeDomain === 'inventory' ? (
        <nav className="context-bar" aria-label="Estoque">
          <Link className="active" aria-current="page" href="/estoque">Posição</Link>
          <Link href="/estoque#lotes">Lotes</Link>
          <Link href="/estoque#movimentos">Movimentos</Link>
          <Link href="/estoque#reconciliacao">Reconciliação</Link>
        </nav>
      ) : activeDomain === 'risk' ? (
        <nav className="context-bar" aria-label="Risco">
          <Link className="active" aria-current="page" href="/risco">Posição</Link>
          <Link href="/risco#exposicao">Exposição</Link>
          <Link href="/risco#cobertura">Cobertura</Link>
          <Link href="/risco#limites">Limites</Link>
        </nav>
      ) : activeDomain === 'financial' ? (
        <nav className="context-bar" aria-label="Financeiro">
          <Link className="active" aria-current="page" href="/financeiro#liquidacoes">Liquidações</Link>
          <Link href="/financeiro#pagar">Contas a pagar</Link>
          <Link href="/financeiro#receber">Contas a receber</Link>
          <Link href="/financeiro#conciliacao">Conciliação</Link>
          <Link href="/financeiro#fluxo-caixa">Fluxo de caixa</Link>
        </nav>
      ) : (
        <nav className="context-bar" aria-label="Fiscal">
          <Link className="active" aria-current="page" href="/fiscal">Documentos</Link>
          <Link href="/fiscal#entrada">Entrada fiscal</Link>
          <Link href="/fiscal#documentos">Validação</Link>
          <span aria-disabled="true">Tributos</span>
          <span aria-disabled="true">Obrigações</span>
        </nav>
      )}

      <main id="conteudo">{children}</main>
    </div>
  );
}
