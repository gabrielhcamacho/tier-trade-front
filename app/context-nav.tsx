'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Domain = 'central' | 'commercial' | 'contracts' | 'operations' | 'inventory' | 'risk' | 'financial' | 'fiscal';
type Tab = { label: string; href?: string };

// Only implemented screens receive a link. Planned screens stay visible and inert.
const tabs: Record<Domain, Tab[]> = {
  central: [
    { label: 'Visão geral', href: '/central' }, { label: 'Minha fila', href: '/central/fila' }, { label: 'Aprovações' },
    { label: 'Alertas' }, { label: 'Roteiro de demonstração', href: '/demonstracao' },
  ],
  commercial: [
    { label: 'Carteira' }, { label: 'Ofertas', href: '/' }, { label: 'Demandas' }, { label: 'Política de margem' },
    { label: 'Negociações' }, { label: 'Formação de preço' }, { label: 'Confirmações' },
  ],
  contracts: [
    { label: 'Lista', href: '/contratos' }, { label: 'Obrigações' }, { label: 'Fixações' },
    { label: 'Entregas' }, { label: 'Custos e margem' }, { label: 'Comissões' }, { label: 'Garantias' }, { label: 'Aditivos' }, { label: 'Assinaturas' },
  ],
  operations: [
    { label: 'Agenda de cargas', href: '/cargas' }, { label: 'Recebimento' },
    { label: 'Qualidade' }, { label: 'Ocorrências' },
  ],
  inventory: [
    { label: 'Posição de estoque', href: '/estoque' }, { label: 'Lotes' },
    { label: 'Movimentos' }, { label: 'Reconciliação' },
  ],
  risk: [
    { label: 'Exposição', href: '/risco' }, { label: 'Cobertura' }, { label: 'Limites' },
  ],
  financial: [
    { label: 'Visão financeira', href: '/financeiro' }, { label: 'Liquidações' },
    { label: 'Contas a receber' }, { label: 'Contas a pagar' },
    { label: 'Conciliação' }, { label: 'Fluxo de caixa' },
  ],
  fiscal: [
    { label: 'Visão fiscal', href: '/fiscal' }, { label: 'Documentos' },
    { label: 'Entrada fiscal' }, { label: 'Validação' }, { label: 'Tributos' }, { label: 'Obrigações' },
  ],
};

const domainLabels: Record<Domain, string> = {
  central: 'Central', commercial: 'Comercial', contracts: 'Contratos', operations: 'Operações',
  inventory: 'Estoque', risk: 'Risco', financial: 'Financeiro', fiscal: 'Fiscal',
};

export function ContextNav({ activeDomain }: { activeDomain: Domain }) {
  const pathname = usePathname();
  return (
    <nav className="context-bar" aria-label={`Telas de ${domainLabels[activeDomain]}`}>
      {tabs[activeDomain].map(({ label, href }) => href ? (
        <Link key={label} className={pathname === href || (href === '/' && pathname.startsWith('/ofertas/')) ? 'active' : undefined} aria-current={pathname === href ? 'page' : undefined} href={href}>{label}</Link>
      ) : (
        <span key={label} aria-disabled="true" title="Tela planejada, ainda indisponível">{label}</span>
      ))}
    </nav>
  );
}
