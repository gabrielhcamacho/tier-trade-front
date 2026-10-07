import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadRisk } from '../../lib/risk';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoPageHeader } from '../demo-ui';
import { RiskWorkspaceView } from './risk-workspace';

const views = {
  overview: ['Exposição', 'Exposição consolidada', 'Posição de risco'],
  coverage: ['Cobertura', 'Execução física', 'Cobertura de vendas'],
  limits: ['Limites', 'Política versionada', 'Limites de risco'],
} as const;

export default async function RiskPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const requestedView = (await searchParams).view;
  const view = requestedView && requestedView in views ? requestedView as keyof typeof views : 'overview';
  const [section, eyebrow, title] = views[view];
  const { userLabel, identityHeaders } = await currentUserContext();
  const result = await loadRisk(identityHeaders);

  return (
    <AppShell activeDomain="risk" userLabel={userLabel}>
      <DemoPageHeader
        domain="Risco"
        section={section}
        eyebrow={eyebrow}
        title={title}
        description="Contratos, estoque, execução e financeiro em uma posição rastreável por tenant."
        scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'}
      />
      <div className="demo-page demo-workspace module-view" data-workspace-view={view}>
        {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data
          ? <div className="feedback critical"><strong>Não foi possível concluir</strong><span>{result.error}</span><Link href="/risco">Tentar novamente</Link></div>
          : <RiskWorkspaceView data={result.data} />}
      </div>
    </AppShell>
  );
}
