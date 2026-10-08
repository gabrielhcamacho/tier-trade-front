import { currentUserContext } from '../../lib/current-user';
import { loadFinance } from '../../lib/finance';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoPageHeader } from '../demo-ui';
import { FinancialWorkspace } from './finance-workspace';
import { PageFeedback } from '../page-state';

const views = {
  overview: ['Visão geral', 'Liquidação e caixa', 'Controle financeiro'],
  settlements: ['Liquidações', 'Operação financeira', 'Liquidações e estornos'],
  receivables: ['Contas a receber', 'Direitos', 'Contas a receber'],
  payables: ['Contas a pagar', 'Obrigações', 'Contas a pagar'],
  reconciliation: ['Conciliação', 'Movimentos bancários', 'Conciliação financeira'],
  commissions: ['Comissões', 'Políticas e apropriações', 'Comissionamento'],
  cashflow: ['Fluxo de caixa', 'Previsão e realizado', 'Fluxo de caixa'],
} as const;

export default async function FinancialPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const requestedView = (await searchParams).view;
  const view = requestedView && requestedView in views ? requestedView as keyof typeof views : 'overview';
  const [section, eyebrow, title] = views[view];
  const { userLabel, identityHeaders } = await currentUserContext();
  const result = await loadFinance(identityHeaders);

  return (
    <AppShell activeDomain="financial" userLabel={userLabel}>
      <DemoPageHeader
        domain="Financeiro"
        section={section}
        eyebrow={eyebrow}
        title={title}
        description="Previsões, títulos e recebimentos vinculados à execução física da venda."
        scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'}
      />
      <div className="demo-page demo-workspace module-view" data-workspace-view={view}>
        {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data
          ? <PageFeedback title="Não foi possível carregar o financeiro" message={result.error} action={{ href: '/financeiro', label: 'Tentar novamente' }} />
          : <FinancialWorkspace data={result.data} />}
      </div>
    </AppShell>
  );
}
