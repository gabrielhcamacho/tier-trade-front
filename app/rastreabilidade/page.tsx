import Link from 'next/link';
import type { ReactNode } from 'react';
import { currentUserContext } from '../../lib/current-user';
import { loadTraceability } from '../../lib/traceability';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { EmptyState, PageFeedback } from '../page-state';

export default async function TraceabilityPage({ searchParams }: { searchParams: Promise<{ operacao?: string; commodity?: string; situacao?: string; criterio?: string }> }) {
  const user = await currentUserContext();
  const [result, filters] = await Promise.all([loadTraceability(user.identityHeaders), searchParams]);
  const criterion = (filters.criterio ?? '').trim().toLocaleLowerCase('pt-BR');
  const purchases = result.data?.purchases.filter((item) => matchesTrace(item, 'COMPRA', filters, criterion)) ?? [];
  const sales = result.data?.sales.filter((item) => matchesTrace(item, 'VENDA', filters, criterion)) ?? [];
  return (
    <AppShell activeDomain="central" userLabel={user.userLabel}>
      <DemoPageHeader domain="Central" section="Rastreabilidade" eyebrow="CADEIA OPERACIONAL" title="Rastreabilidade consolidada" description="Do negócio comercial à execução física, fiscal, estoque e liquidação." scope={result.data ? `${result.data.tenantName} · dados persistidos` : 'Dados indisponíveis'} />
      <div className="demo-page demo-workspace traceability-page">
        {result.data?.isDemo ? <DemoNotice persisted /> : null}
        {result.error || !result.data ? <PageFeedback title="Não foi possível consolidar a rastreabilidade" message={result.error} action={{ href: '/rastreabilidade', label: 'Tentar novamente' }} /> : <>
          <form className="traceability-filters" method="get">
            <label><span>Operação</span><select name="operacao" defaultValue={filters.operacao ?? 'TODAS'}><option value="TODAS">Compras e vendas</option><option value="COMPRA">Compras</option><option value="VENDA">Vendas</option></select></label>
            <label><span>Commodity</span><select name="commodity" defaultValue={filters.commodity ?? 'TODAS'}><option value="TODAS">Milho e soja</option><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></label>
            <label><span>Situação</span><select name="situacao" defaultValue={filters.situacao ?? 'TODAS'}><option value="TODAS">Todas</option><option value="COMPLETA">Cadeia completa</option><option value="PENDENTE">Com pendência</option></select></label>
            <label className="traceability-search"><span>Buscar</span><input name="criterio" defaultValue={filters.criterio ?? ''} maxLength={120} placeholder="Contrato, contraparte, carga, NF-e, lote ou título" /></label>
            <button type="submit">Aplicar filtros</button><Link href="/rastreabilidade">Limpar</Link>
          </form>
          <DemoMetricStrip items={[
            { label: 'Ofertas', value: String(result.data.totals.offers), detail: 'origens comerciais' },
            { label: 'Contratos', value: String(result.data.totals.contracts), detail: 'compras e vendas', tone: 'primary' },
            { label: 'Cargas e lotes', value: `${result.data.totals.loads} / ${result.data.totals.lots}`, detail: 'execução e saldo físico' },
            { label: 'Documentos e eventos', value: `${result.data.totals.documents} / ${result.data.totals.financialEvents}`, detail: 'fiscal e financeiro' },
          ]} />
          {(filters.operacao ?? 'TODAS') !== 'VENDA' ? <DemoSection kicker="COMPRA" title="Oferta, contrato, recebimento e estoque" aside={`${purchases.length} cadeia(s) no filtro`}>
            {purchases.length ? <DemoTable label="Rastreabilidade de compras" columns={['Contrato', 'Fornecedor', 'Produto', 'Oferta', 'Cargas', 'Fiscal', 'Estoque', 'Financeiro', 'Situação']} rows={purchases.map((item) => [
              <Link key={item.contractId} href={`/contratos/${item.contractId}`}>{item.externalNumber ?? item.contractId.slice(-8).toUpperCase()}</Link>,
              item.counterpartyName, item.commodity, item.offerId ? <Link key={item.offerId} href={`/ofertas/${item.offerId}`}>{item.offerId.slice(-8).toUpperCase()}</Link> : '—',
              stage(item.loadIds.length, item.loadIds.length ? item.loadIds.map((id) => <Link key={id} href={`/cargas/${id}`}>{id.slice(-8).toUpperCase()}</Link>) : 'Sem carga'),
              stage(item.fiscalDocumentNumbers.length, item.fiscalDocumentNumbers.join(', ') || 'Sem NF-e'),
              stage(item.lotCodes.length, item.lotCodes.length ? `${item.lotCodes.join(', ')} · ${item.movementCount} movimento(s)` : 'Sem lote'),
              stage(item.financialTitleNumbers.length, item.financialTitleNumbers.join(', ') || 'Sem título'),
              chainStatus(isPurchaseComplete(item), item.statuses.fiscal.includes('REJECTED')),
            ])} /> : <EmptyState compact title="Nenhuma cadeia de compra disponível" description="Uma oferta aprovada e convertida em contrato inicia esta rastreabilidade." action={{ href: '/ofertas/nova', label: 'Criar oferta' }} />}
          </DemoSection> : null}
          {(filters.operacao ?? 'TODAS') !== 'COMPRA' ? <DemoSection kicker="VENDA" title="Contrato, expedição, fiscal e liquidação" aside={`${sales.length} cadeia(s) no filtro`}>
            {sales.length ? <DemoTable label="Rastreabilidade de vendas" columns={['Contrato', 'Cliente', 'Produto', 'Expedição', 'Fiscal', 'Financeiro', 'Liquidação', 'Situação']} rows={sales.map((item) => [
              <Link key={item.contractId} href={`/comercial/vendas/${item.contractId}`}>{item.reference}</Link>, item.counterpartyName, item.commodity,
              stage(item.dispatchIds.length, item.dispatchIds.length ? `${item.dispatchIds.length} expedição(ões)` : 'Sem expedição'),
              stage(item.fiscalDocumentNumbers.length, item.fiscalDocumentNumbers.join(', ') || 'Sem NF-e'),
              stage(item.financialTitleNumbers.length, item.financialTitleNumbers.join(', ') || 'Sem título'),
              stage(item.settlementCount, item.settlementCount ? `${item.settlementCount} baixa(s)` : 'Sem baixa'),
              chainStatus(isSaleComplete(item), item.statuses.fiscal.includes('REJECTED')),
            ])} /> : <EmptyState compact title="Nenhuma cadeia de venda disponível" description="Cadastre um contrato de venda e aloque estoque para iniciar a expedição." action={{ href: '/comercial/vendas', label: 'Abrir vendas' }} />}
          </DemoSection> : null}
        </>}
      </div>
    </AppShell>
  );
}

type PurchaseTrace = NonNullable<Awaited<ReturnType<typeof loadTraceability>>['data']>['purchases'][number];
type SaleTrace = NonNullable<Awaited<ReturnType<typeof loadTraceability>>['data']>['sales'][number];

function isPurchaseComplete(item: PurchaseTrace) { return Boolean(item.offerId && item.loadIds.length && item.fiscalDocumentNumbers.length && item.lotCodes.length && item.financialTitleNumbers.length); }
function isSaleComplete(item: SaleTrace) { return Boolean(item.dispatchIds.length && item.fiscalDocumentNumbers.length && item.financialTitleNumbers.length && item.settlementCount); }
function matchesTrace(item: PurchaseTrace | SaleTrace, operation: 'COMPRA' | 'VENDA', filters: { operacao?: string; commodity?: string; situacao?: string }, criterion: string) {
  if (filters.operacao && filters.operacao !== 'TODAS' && filters.operacao !== operation) return false;
  if (filters.commodity && filters.commodity !== 'TODAS' && filters.commodity !== item.commodity) return false;
  const complete = operation === 'COMPRA' ? isPurchaseComplete(item as PurchaseTrace) : isSaleComplete(item as SaleTrace);
  if (filters.situacao === 'COMPLETA' && !complete) return false;
  if (filters.situacao === 'PENDENTE' && complete) return false;
  if (!criterion) return true;
  const values = operation === 'COMPRA'
    ? Object.values(item as PurchaseTrace).flatMap((value) => Array.isArray(value) ? value : [value])
    : Object.values(item as SaleTrace).flatMap((value) => Array.isArray(value) ? value : [value]);
  return values.some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(criterion));
}
function stage(count: number, content: ReactNode) { return <span className="trace-stage" data-complete={count > 0 || undefined}>{content}</span>; }
function chainStatus(complete: boolean, rejected: boolean) { return <DemoStatus tone={rejected ? 'critical' : complete ? 'positive' : 'attention'}>{rejected ? 'Revisão fiscal' : complete ? 'Completa' : 'Pendente'}</DemoStatus>; }
