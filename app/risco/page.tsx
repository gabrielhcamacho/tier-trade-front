import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadRisk } from '../../lib/risk';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoPageHeader } from '../demo-ui';
import { RiskWorkspaceView } from './risk-workspace';

export default async function RiskPage() {
  const { userLabel, identityHeaders } = await currentUserContext();
  const result = await loadRisk(identityHeaders);

  return (
    <AppShell activeDomain="risk" userLabel={userLabel}>
      <DemoPageHeader
        domain="Risco"
        section="Posição"
        eyebrow="Exposição consolidada"
        title="Posição de risco"
        description="Contratos, estoque, execução e financeiro em uma posição rastreável por tenant."
        scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'}
      />
      <div className="demo-page demo-workspace">
        {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data
          ? <div className="feedback critical"><strong>Não foi possível concluir</strong><span>{result.error}</span><Link href="/risco">Tentar novamente</Link></div>
          : <RiskWorkspaceView data={result.data} />}
      </div>
    </AppShell>
  );
}
