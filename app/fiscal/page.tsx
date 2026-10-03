import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadFiscal } from '../../lib/fiscal';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoPageHeader } from '../demo-ui';
import { FiscalWorkspaceView } from './fiscal-workspace';

export default async function FiscalPage() {
  const { userLabel, identityHeaders } = await currentUserContext();
  const result = await loadFiscal(identityHeaders);

  return (
    <AppShell activeDomain="fiscal" userLabel={userLabel}>
      <DemoPageHeader
        domain="Fiscal"
        section="Documentos"
        eyebrow="Configuração, recebimento e validação"
        title="Documentos fiscais"
        description="Configurações versionadas, cálculo determinístico com memória e NF-e vinculada à operação."
        scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'}
      />
      <div className="demo-page demo-workspace">
        {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data
          ? <div className="feedback critical"><strong>Não foi possível concluir</strong><span>{result.error}</span><Link href="/fiscal">Tentar novamente</Link></div>
          : <FiscalWorkspaceView data={result.data} />}
      </div>
    </AppShell>
  );
}
