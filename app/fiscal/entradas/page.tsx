import { currentUserContext } from '../../../lib/current-user';
import { loadFiscal } from '../../../lib/fiscal';
import { AppShell } from '../../app-shell';
import { DemoNotice } from '../../demo-notice';
import { DemoPageHeader } from '../../demo-ui';
import { PurchaseFiscalWorkspace } from './purchase-fiscal-workspace';
import { PageFeedback } from '../../page-state';

export default async function PurchaseFiscalPage() {
  const { userLabel, identityHeaders } = await currentUserContext();
  const result = await loadFiscal(identityHeaders);
  return <AppShell activeDomain="fiscal" userLabel={userLabel}>
    <DemoPageHeader domain="Fiscal" section="Entrada fiscal" eyebrow="Compra · documento e obrigação" title="Notas fiscais de entrada" description="Concilie a NF-e com o recebimento aceito e gere o contas a pagar somente após validação." scope={result.data ? `${result.data.tenant.legalName} · posição atual` : 'Dados indisponíveis'} />
    <div className="demo-page demo-workspace">
      {result.data?.tenant.isDemo ? <DemoNotice persisted /> : null}
      {result.error || !result.data ? <PageFeedback title="Não foi possível carregar as entradas fiscais" message={result.error} action={{ href: '/fiscal/entradas', label: 'Tentar novamente' }} /> : <PurchaseFiscalWorkspace data={result.data} />}
    </div>
  </AppShell>;
}
