import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadFinance } from '../../lib/finance';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoPageHeader } from '../demo-ui';
import { FinancialWorkspace } from './finance-workspace';

export default async function FinancialPage() {
  const { userLabel, identityHeaders } = await currentUserContext();
  const result = await loadFinance(identityHeaders);

  return (
    <AppShell activeDomain="financial" userLabel={userLabel}>
      <DemoPageHeader
        domain="Financeiro"
        section="Visão geral"
        eyebrow="Liquidação e caixa"
        title="Controle financeiro"
        description="Previsões, títulos e recebimentos vinculados à execução física da venda."
        scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'}
      />
      <div className="demo-page demo-workspace">
        {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data
          ? <div className="feedback critical"><strong>Não foi possível concluir</strong><span>{result.error}</span><Link href="/financeiro">Tentar novamente</Link></div>
          : <FinancialWorkspace data={result.data} />}
      </div>
    </AppShell>
  );
}
