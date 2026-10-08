import { currentUserContext } from '../../../lib/current-user';
import { loadFinance } from '../../../lib/finance';
import { AppShell } from '../../app-shell';
import { DemoNotice } from '../../demo-notice';
import { DemoPageHeader } from '../../demo-ui';
import { FinancialWorkspace } from '../../financeiro/finance-workspace';
import { PageFeedback } from '../../page-state';

export default async function ContractCommissionsPage() {
  const { userLabel, identityHeaders } = await currentUserContext();
  const result = await loadFinance(identityHeaders);

  return (
    <AppShell activeDomain="contracts" userLabel={userLabel}>
      <DemoPageHeader
        domain="Contratos"
        section="Comissões"
        eyebrow="Políticas e apropriações"
        title="Comissionamento"
        description="Configure versões da política e aproprie comissões sobre eventos financeiros rastreáveis."
        scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'}
      />
      <div className="demo-page demo-workspace module-view" data-workspace-view="commissions">
        {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data
          ? <PageFeedback title="Não foi possível carregar as comissões" message={result.error} action={{ href: '/contratos/comissoes', label: 'Tentar novamente' }} />
          : <FinancialWorkspace data={result.data} />}
      </div>
    </AppShell>
  );
}
