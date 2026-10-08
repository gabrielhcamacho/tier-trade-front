import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadTraceability } from '../../lib/traceability';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { EmptyState, PageFeedback } from '../page-state';

export default async function TraceabilityPage() {
  const user = await currentUserContext();
  const result = await loadTraceability(user.identityHeaders);
  return (
    <AppShell activeDomain="central" userLabel={user.userLabel}>
      <DemoPageHeader domain="Central" section="Rastreabilidade" eyebrow="CADEIA OPERACIONAL" title="Rastreabilidade consolidada" description="Do negócio comercial à execução física, fiscal, estoque e liquidação." scope={result.data ? `${result.data.tenantName} · dados persistidos` : 'Dados indisponíveis'} />
      <div className="demo-page demo-workspace traceability-page">
        {result.data?.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data ? <PageFeedback title="Não foi possível consolidar a rastreabilidade" message={result.error} action={{ href: '/rastreabilidade', label: 'Tentar novamente' }} /> : <>
          <DemoMetricStrip items={[
            { label: 'Ofertas', value: String(result.data.totals.offers), detail: 'origens comerciais' },
            { label: 'Contratos', value: String(result.data.totals.contracts), detail: 'compras e vendas', tone: 'primary' },
            { label: 'Cargas e lotes', value: `${result.data.totals.loads} / ${result.data.totals.lots}`, detail: 'execução e saldo físico' },
            { label: 'Documentos e eventos', value: `${result.data.totals.documents} / ${result.data.totals.financialEvents}`, detail: 'fiscal e financeiro' },
          ]} />
          <DemoSection kicker="COMPRA" title="Oferta, contrato, recebimento e estoque" aside={`${result.data.purchases.length} cadeia(s)`}>
            {result.data.purchases.length ? <DemoTable label="Rastreabilidade de compras" columns={['Contrato', 'Fornecedor', 'Produto', 'Oferta', 'Cargas', 'NF-e', 'Lotes', 'Movimentos', 'Títulos', 'Estado']} rows={result.data.purchases.map((item) => [
              <Link key={item.contractId} href={`/contratos/${item.contractId}`}>{item.externalNumber ?? item.contractId.slice(-8).toUpperCase()}</Link>,
              item.counterpartyName, item.commodity, item.offerId ? <Link key={item.offerId} href={`/ofertas/${item.offerId}`}>{item.offerId.slice(-8).toUpperCase()}</Link> : '—',
              item.loadIds.length ? item.loadIds.map((id) => <Link key={id} href={`/cargas/${id}`}>{id.slice(-8).toUpperCase()}</Link>) : '—',
              item.fiscalDocumentNumbers.join(', ') || '—', item.lotCodes.join(', ') || '—', String(item.movementCount), item.financialTitleNumbers.join(', ') || '—',
              <DemoStatus key={`${item.contractId}-status`} tone={item.statuses.fiscal.includes('REJECTED') ? 'critical' : 'positive'}>{item.statuses.contract}</DemoStatus>,
            ])} /> : <EmptyState compact title="Nenhuma cadeia de compra disponível" description="Uma oferta aprovada e convertida em contrato inicia esta rastreabilidade." action={{ href: '/ofertas/nova', label: 'Criar oferta' }} />}
          </DemoSection>
          <DemoSection kicker="VENDA" title="Contrato, expedição, fiscal e liquidação" aside={`${result.data.sales.length} cadeia(s)`}>
            {result.data.sales.length ? <DemoTable label="Rastreabilidade de vendas" columns={['Contrato', 'Cliente', 'Produto', 'Expedições', 'NF-e', 'Títulos', 'Liquidações', 'Estado']} rows={result.data.sales.map((item) => [
              <Link key={item.contractId} href={`/comercial/vendas/${item.contractId}`}>{item.reference}</Link>, item.counterpartyName, item.commodity, String(item.dispatchIds.length), item.fiscalDocumentNumbers.join(', ') || '—', item.financialTitleNumbers.join(', ') || '—', String(item.settlementCount),
              <DemoStatus key={`${item.contractId}-status`} tone={item.statuses.fiscal.includes('REJECTED') ? 'critical' : 'positive'}>{item.statuses.contract}</DemoStatus>,
            ])} /> : <EmptyState compact title="Nenhuma cadeia de venda disponível" description="Cadastre um contrato de venda e aloque estoque para iniciar a expedição." action={{ href: '/comercial/vendas', label: 'Abrir vendas' }} />}
          </DemoSection>
        </>}
      </div>
    </AppShell>
  );
}
