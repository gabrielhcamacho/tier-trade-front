'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type Domain = 'central' | 'commercial' | 'contracts' | 'operations' | 'inventory' | 'risk' | 'financial' | 'fiscal';
type Tab = { label: string; href?: string; unavailableReason?: string };

// Only implemented screens receive a link. Planned screens stay visible and inert.
const tabs: Record<Domain, Tab[]> = {
  central: [
    { label: 'Visão geral', href: '/central' }, { label: 'Minha fila', href: '/central/fila' },
    { label: 'Aprovações', href: '/central/fila?view=approvals' },
    { label: 'Alertas', href: '/central/fila?view=alerts' }, { label: 'Rastreabilidade', href: '/rastreabilidade' }, { label: 'Roteiro de demonstração', href: '/demonstracao' },
  ],
  commercial: [
    { label: 'Visão geral', href: '/comercial' }, { label: 'Carteira', href: '/comercial/carteira' }, { label: 'Ofertas', href: '/ofertas' }, { label: 'Vendas', href: '/comercial/vendas' }, { label: 'Demandas', href: '/comercial/demandas' }, { label: 'Política de margem', href: '/comercial/politica-margem' },
    { label: 'Negociações', href: '/comercial/negociacoes' },
    { label: 'Formação de preço', unavailableReason: 'A formação já existe dentro de cada oferta; a tela consolidada ainda não foi construída.' },
    { label: 'Confirmações', href: '/comercial/confirmacoes' },
  ],
  contracts: [
    { label: 'Visão geral', href: '/contratos/visao-geral' }, { label: 'Lista', href: '/contratos' }, { label: 'Obrigações', href: '/contratos/obrigacoes' },
    { label: 'Documentos', href: '/documentos' },
    { label: 'Fixações', unavailableReason: 'Disponível após a homologação das regras de preço a fixar e fixações parciais.' },
    { label: 'Entregas', href: '/contratos?view=deliveries' }, { label: 'Custos e margem', href: '/contratos?view=economics' },
    { label: 'Comissões', href: '/contratos/comissoes' }, { label: 'Garantias', href: '/contratos?view=guarantees' },
    { label: 'Aditivos', href: '/contratos?view=amendments' }, { label: 'Assinaturas', href: '/contratos?view=signatures' },
  ],
  operations: [
    { label: 'Visão geral', href: '/operacoes' }, { label: 'Agenda de cargas', href: '/cargas' }, { label: 'Pátio', href: '/patio' },
    { label: 'Recebimento', href: '/recebimentos' }, { label: 'Qualidade', href: '/qualidade' },
    { label: 'Ocorrências', href: '/ocorrencias' },
  ],
  inventory: [
    { label: 'Visão geral', href: '/estoque/visao-geral' }, { label: 'Posição de estoque', href: '/estoque' }, { label: 'Lotes', href: '/estoque?view=lots' },
    { label: 'Movimentos', href: '/estoque?view=movements' }, { label: 'Reconciliação', href: '/estoque?view=reconciliation' },
  ],
  risk: [
    { label: 'Visão geral', href: '/risco/visao-geral' }, { label: 'Exposição', href: '/risco' }, { label: 'Cobertura', href: '/risco?view=coverage' },
    { label: 'Limites', href: '/risco?view=limits' },
  ],
  financial: [
    { label: 'Visão geral', href: '/financeiro/visao-geral' }, { label: 'Visão financeira', href: '/financeiro' }, { label: 'Liquidações', href: '/financeiro?view=settlements' },
    { label: 'Contas a receber', href: '/financeiro?view=receivables' }, { label: 'Contas a pagar', href: '/financeiro?view=payables' },
    { label: 'Conciliação', href: '/financeiro?view=reconciliation' }, { label: 'Comissões', href: '/financeiro?view=commissions' },
    { label: 'Fluxo de caixa', href: '/financeiro?view=cashflow' },
  ],
  fiscal: [
    { label: 'Visão geral', href: '/fiscal/visao-geral' }, { label: 'Visão fiscal', href: '/fiscal' }, { label: 'Documentos', href: '/fiscal?view=documents' },
    { label: 'Entrada fiscal', href: '/fiscal/entradas' }, { label: 'Validação', href: '/fiscal?view=validation' },
    { label: 'Tributos', href: '/fiscal?view=taxes' }, { label: 'Obrigações', href: '/fiscal?view=obligations' },
  ],
};

const domainLabels: Record<Domain, string> = {
  central: 'Central', commercial: 'Comercial', contracts: 'Contratos', operations: 'Operações',
  inventory: 'Estoque', risk: 'Risco', financial: 'Financeiro', fiscal: 'Fiscal',
};

function ContextNavContent({ activeDomain }: { activeDomain: Domain }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const currentFrom = searchParams.get('from');
  const hasExactPathTarget = tabs[activeDomain].some(({ href }) => href?.split('?')[0] === pathname);
  return (
    <nav className="context-bar" aria-label={`Telas de ${domainLabels[activeDomain]}`}>
      {tabs[activeDomain].map(({ label, href, unavailableReason }) => href ? (
        <Link key={label} className={isActiveTab(pathname, currentView, currentFrom, href, hasExactPathTarget) ? 'active' : undefined} aria-current={isActiveTab(pathname, currentView, currentFrom, href, hasExactPathTarget) ? 'page' : undefined} href={href}>{label}</Link>
      ) : (
        <span key={label} aria-disabled="true" title={unavailableReason ?? 'Tela planejada, ainda indisponível'}>{label}</span>
      ))}
    </nav>
  );
}

export function ContextNav({ activeDomain }: { activeDomain: Domain }) {
  return (
    <Suspense fallback={<nav className="context-bar" aria-hidden="true" />}>
      <ContextNavContent activeDomain={activeDomain} />
    </Suspense>
  );
}

function isActiveTab(pathname: string, currentView: string | null, currentFrom: string | null, href: string, hasExactPathTarget: boolean): boolean {
  if (pathname.startsWith('/contratos/') && currentFrom === 'obligations') return href === '/contratos/obrigacoes';
  const [targetPath, query = ''] = href.split('?');
  const targetView = new URLSearchParams(query).get('view');
  const pathMatches = pathname === targetPath
    || (targetPath === '/ofertas' && pathname.startsWith('/ofertas/'))
    || (!hasExactPathTarget && targetPath !== '/' && pathname.startsWith(`${targetPath}/`));
  if (!pathMatches) return false;
  return targetView ? currentView === targetView : currentView === null;
}
