import { currentUserContext } from '../../lib/current-user';
import { loadFiscal } from '../../lib/fiscal';
import { loadDocuments } from '../../lib/documents';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoPageHeader } from '../demo-ui';
import { FiscalWorkspaceView } from './fiscal-workspace';
import { PageFeedback } from '../page-state';

const views = {
  overview: ['Visão fiscal', 'Configuração, recebimento e validação', 'Visão fiscal'],
  documents: ['Documentos', 'Registro e rastreabilidade', 'Documentos fiscais'],
  validation: ['Validação', 'Conferência documental', 'Validação fiscal'],
  taxes: ['Tributos', 'Cálculo determinístico', 'Tributos e retenções'],
  obligations: ['Obrigações', 'Agenda fiscal', 'Obrigações fiscais'],
} as const;

export default async function FiscalPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const requestedView = (await searchParams).view;
  const view = requestedView && requestedView in views ? requestedView as keyof typeof views : 'overview';
  const [section, eyebrow, title] = views[view];
  const { userLabel, identityHeaders } = await currentUserContext();
  const [result, documentResult] = await Promise.all([
    loadFiscal(identityHeaders),
    loadDocuments(identityHeaders, 'FISCAL_DOCUMENT'),
  ]);

  return (
    <AppShell activeDomain="fiscal" userLabel={userLabel}>
      <DemoPageHeader
        domain="Fiscal"
        section={section}
        eyebrow={eyebrow}
        title={title}
        description="Configurações versionadas, cálculo determinístico com memória e NF-e vinculada à operação."
        scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'}
      />
      <div className="demo-page demo-workspace module-view" data-workspace-view={view}>
        {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data
          ? <PageFeedback title="Não foi possível carregar o fiscal" message={result.error} action={{ href: '/fiscal', label: 'Tentar novamente' }} />
          : <FiscalWorkspaceView data={result.data} attachments={documentResult.items} attachmentError={documentResult.error} />}
      </div>
    </AppShell>
  );
}
