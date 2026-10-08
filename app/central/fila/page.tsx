import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { ClickableSurface } from '../../clickable-surface';
import { currentUserContext } from '../../../lib/current-user';
import { commodityLabel, formatCurrency, formatQuantity, loadOpenContractObligations, type OpenContractObligation } from '../../../lib/contracts';
import { loadOverview, type OverviewResponse } from '../../../lib/overview';
import { PageFeedback } from '../../page-state';

export const dynamic = 'force-dynamic';

type QueueItem = {
  id: string; kind: string; title: string; description: string; dueDate: string | null;
  status: string; tone: 'neutral' | 'info' | 'attention' | 'critical'; href: string; priority: number;
};

function localDate(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (part: string) => parts.find((item) => item.type === part)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function formatDue(value: string | null): string {
  return value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`)) : 'Não informado';
}

function obligationItem(item: OpenContractObligation, today: string): QueueItem {
  const overdue = Boolean(item.due_date && item.due_date < today);
  return {
    id: item.id, kind: 'Obrigação contratual', title: item.title,
    description: `${item.counterparty_name} · ${commodityLabel(item.commodity)} · ${item.responsible_name ?? 'sem responsável definido'}`,
    dueDate: item.due_date, status: overdue ? 'Atrasada' : item.status === 'IN_PROGRESS' ? 'Em andamento' : 'Pendente',
    tone: overdue ? 'critical' : item.status === 'IN_PROGRESS' ? 'info' : 'neutral',
    href: `/contratos/${item.contract_id}#obrigacoes`, priority: overdue ? 0 : item.due_date ? 2 : 4,
  };
}

function alertItems(data: OverviewResponse, capabilities: Set<string>): QueueItem[] {
  const alerts: QueueItem[] = [];
  if (capabilities.has('OPERATIONS_EDIT') && data.operational.openOccurrences > 0) alerts.push({
    id: 'occurrences', kind: 'Operações', title: 'Ocorrências abertas',
    description: `${data.operational.openOccurrences} ocorrência(s), ${data.operational.criticalOccurrences} crítica(s)`,
    dueDate: null, status: 'Revisar', tone: data.operational.criticalOccurrences ? 'critical' : 'attention',
    href: '/ocorrencias', priority: data.operational.criticalOccurrences ? 1 : 3,
  });
  if (capabilities.has('OPERATIONS_EDIT') && data.operational.qualityReviews > 0) alerts.push({
    id: 'quality', kind: 'Qualidade', title: 'Recebimentos aguardando decisão',
    description: `${data.operational.qualityReviews} revisão(ões) de qualidade`,
    dueDate: null, status: 'Revisar', tone: 'attention', href: '/qualidade', priority: 3,
  });
  if (capabilities.has('FISCAL_EDIT') && (data.operational.fiscalPending || data.operational.fiscalRejected)) alerts.push({
    id: 'fiscal', kind: 'Fiscal', title: 'Documentos fiscais para conferência',
    description: `${data.operational.fiscalPending} recebido(s) · ${data.operational.fiscalRejected} rejeitado(s)`,
    dueDate: null, status: 'Conferir', tone: 'attention', href: '/fiscal/entradas', priority: 3,
  });
  if (capabilities.has('FINANCE_APPROVE') && data.indicators.paymentBatchApprovalCount > 0) alerts.push({
    id: 'payments', kind: 'Financeiro', title: 'Lotes de pagamento aguardando aprovação',
    description: `${data.indicators.paymentBatchApprovalCount} lote(s) pendente(s)`,
    dueDate: null, status: 'Aprovar', tone: 'attention', href: '/financeiro#lotes', priority: 3,
  });
  if (capabilities.has('FINANCE_EDIT') && data.indicators.unmatchedBankEntryCount > 0) alerts.push({
    id: 'bank', kind: 'Financeiro', title: 'Lançamentos bancários sem conciliação',
    description: `${data.indicators.unmatchedBankEntryCount} lançamento(s) pendente(s)`,
    dueDate: null, status: 'Conciliar', tone: 'info', href: '/financeiro#conciliacao-bancaria', priority: 3,
  });
  if (capabilities.has('RISK_MANAGE')) for (const position of data.sources.risk.positions) {
    if (position.limit.status !== 'WARNING' && position.limit.status !== 'EXCEEDED') continue;
    alerts.push({ id: `risk-${position.commodity}`, kind: 'Risco',
      title: `Limite de ${commodityLabel(position.commodity)} em atenção`,
      description: position.limit.usagePct ? `${position.limit.usagePct}% do limite utilizado` : 'Ver posição de risco',
      dueDate: null, status: position.limit.status === 'EXCEEDED' ? 'Excedido' : 'Atenção',
      tone: position.limit.status === 'EXCEEDED' ? 'critical' : 'attention', href: '/risco', priority: 3 });
  }
  return alerts;
}

export default async function CentralPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const requestedView = (await searchParams).view;
  const view = requestedView === 'approvals' || requestedView === 'alerts' ? requestedView : 'queue';
  const viewTitle = view === 'approvals' ? 'Aprovações' : view === 'alerts' ? 'Alertas operacionais' : 'O que precisa da sua atenção';
  const user = await currentUserContext();
  const [overview, openObligations] = await Promise.all([
    loadOverview(user.identityHeaders, 'ALL'), loadOpenContractObligations(user.identityHeaders),
  ]);
  const data = overview.data;
  const capabilities = new Set(data?.access.capabilities ?? []);
  const offers = data?.sources.offers.items ?? [];
  const approvals = capabilities.has('COMMERCIAL_APPROVE')
    ? offers.filter((item) => item.status === 'IN_APPROVAL') : [];
  const obligations = capabilities.has('COMMERCIAL_EDIT') && !openObligations.error
    ? openObligations.items.map((item) => obligationItem(item, data ? localDate(data.tenant.timezone) : '')) : [];
  const approvalItems: QueueItem[] = approvals.map((item) => ({
    id: `approval-${item.id}`, kind: 'Aprovação comercial',
    title: `Oferta de ${commodityLabel(item.commodity)} · ${item.counterparty_name}`,
    description: `${formatQuantity(item.quantity_sc)} sc · margem projetada ${formatCurrency(item.projected_margin_per_sc)}/sc`,
    dueDate: null, status: 'Aguardando', tone: 'attention',
    href: `/?status=IN_APPROVAL&commodity=${item.commodity}`, priority: 1,
  }));
  const alerts = data ? alertItems(data, capabilities) : [];
  const queue = [...obligations, ...approvalItems, ...alerts].sort((a, b) =>
    a.priority - b.priority || (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    || a.title.localeCompare(b.title, 'pt-BR'));
  const openOffers = offers.filter((item) => item.status !== 'CONVERTED' && item.status !== 'CANCELLED').length;
  const errors = [overview.error, openObligations.error].filter(Boolean);

  return <AppShell activeDomain="central" userLabel={user.userLabel}>
    <header className="page-header central-header"><p className="breadcrumbs">Central <span>›</span> {view === 'queue' ? 'Minha fila' : viewTitle}</p>
      <div className="page-header-row"><div><p className="entity-kind">Visão de trabalho</p><h1>{viewTitle}</h1>
        <p className="page-description">Pendências da carteira acessíveis conforme suas permissões. Prazos só aparecem quando registrados.</p></div>
        <span className="environment-label">{data?.tenant.legalName ?? 'Ambiente autenticado'}</span></div></header>
    <div className="demo-page">
      {data?.tenant.isDemo ? <div className="overview-demo-note">Ambiente de demonstração · dados salvos no backend deste tenant e isolados das outras contas.</div> : null}
      {errors.length ? <PageFeedback title="Dados parciais" message={errors.join(' ')} action={{ href: '/central/fila', label: 'Tentar novamente' }} /> : null}
      <section className="central-metrics" aria-label="Indicadores da carteira">
        <article><span>Ofertas abertas</span><strong>{data ? openOffers : '—'}</strong><small>Carteira comercial do tenant</small></article>
        <article data-primary="true"><span>Obrigações em aberto</span><strong>{data ? data.indicators.pendingObligationCount : '—'}</strong><small>Contratos ativos</small></article>
        <article><span>Ocorrências abertas</span><strong>{data ? data.operational.openOccurrences : '—'}</strong><small>{data ? `${data.operational.criticalOccurrences} crítica(s)` : 'Fonte indisponível'}</small></article>
        <article data-tone="attention"><span>Aguardando aprovação</span><strong>{data ? approvals.length : '—'}</strong><small>Ofertas na sua alçada comercial</small></article>
      </section>
      {queue.some((item) => item.tone === 'critical') ? <section className="exception-summary" aria-label="Exceções críticas">
        <span aria-hidden="true">!</span><div><strong>Existem pendências críticas</strong><p>Verifique obrigações vencidas, limites excedidos e ocorrências críticas abaixo.</p></div><a href="#fila">Ver fila</a>
      </section> : null}
      <div className="central-layout"><div className="central-main-column">
        {view === 'queue' ? <section className="central-section" id="fila" aria-labelledby="work-queue-title">
          <header><div><p className="section-kicker">PRIORIDADES</p><h2 id="work-queue-title">Fila de trabalho</h2></div><span>Prazos vencidos primeiro; demais itens por tipo e prazo conhecido</span></header>
          <div className="work-queue">{queue.length ? queue.map((item, index) => <ClickableSurface key={item.id} href={item.href} label={`Abrir ${item.title}`}>
            <span className="queue-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="queue-copy"><small>{item.kind}</small><strong>{item.title}</strong><p>{item.description}</p></div>
            <div className="queue-due"><small>Prazo</small><strong>{formatDue(item.dueDate)}</strong></div>
            <span className="demo-status" data-tone={item.tone}>{item.status}</span><span className="clickable-surface-action" aria-hidden="true">Abrir →</span>
          </ClickableSurface>) : <div className="central-empty-state">{errors.length ? 'A fila não pôde ser carregada por completo.' : 'Nenhuma pendência acionável para suas permissões neste momento.'}</div>}</div>
          {openObligations.hasMore ? <p className="central-list-note">A lista mostra as primeiras 100 obrigações por prazo. Consulte os contratos para ver o restante.</p> : null}
        </section> : null}
        {view === 'approvals' ? <section className="central-section" id="aprovacoes" aria-labelledby="approvals-title">
          <header><div><p className="section-kicker">ALÇADA COMERCIAL</p><h2 id="approvals-title">Aprovações</h2></div><span>A decisão permanece humana e auditada no Comercial</span></header>
          {approvals.length ? approvals.map((offer, index) => <ClickableSurface className="approval-preview" key={offer.id} href={`/ofertas?status=IN_APPROVAL&commodity=${offer.commodity}`} label={`Analisar oferta de ${commodityLabel(offer.commodity)} de ${offer.counterparty_name}`}>
            <div className="approval-heading"><span className="approval-flag">{String(index + 1).padStart(2, '0')}</span>
              <div><small>OFERTA EM APROVAÇÃO</small><h3>{commodityLabel(offer.commodity)} · {formatQuantity(offer.quantity_sc)} sc</h3><p>{offer.counterparty_name} · {offer.id.slice(0, 8)}</p></div>
              <span className="demo-status" data-tone="attention">Aguardando</span></div>
            <dl><div><dt>Preço de compra</dt><dd>{formatCurrency(offer.purchase_price_per_sc)}/sc</dd></div>
              <div><dt>Margem projetada</dt><dd>{formatCurrency(offer.projected_margin_per_sc)}/sc</dd></div>
              <div><dt>Janela de entrega</dt><dd>{formatDue(offer.delivery_start)} a {formatDue(offer.delivery_end)}</dd></div></dl>
            <footer><p>Consulte o cenário e a política vigente antes de decidir.</p><span className="clickable-surface-action">Analisar no Comercial →</span></footer>
          </ClickableSurface>) : <div className="central-empty-state">{data ? 'Nenhuma oferta aguardando sua alçada comercial.' : 'Aprovações indisponíveis.'}</div>}
        </section> : null}
        {view === 'alerts' ? <section className="central-section" id="alertas" aria-labelledby="alerts-title">
          <header><div><p className="section-kicker">EXCEÇÕES</p><h2 id="alerts-title">Alertas operacionais</h2></div></header>
          <div className="central-alerts">{alerts.length ? alerts.map((item) => <ClickableSurface className="demo-alert" data-tone={item.tone === 'critical' || item.tone === 'attention' ? 'attention' : undefined} key={item.id} href={item.href} label={`Abrir ${item.title}`}>
            <strong>{item.title}</strong><p>{item.description}</p><span className="clickable-surface-action" aria-hidden="true">Abrir área responsável →</span>
          </ClickableSurface>) : <div className="central-empty-state">{data ? 'Nenhum alerta acionável nas áreas liberadas para seu usuário.' : 'Alertas indisponíveis.'}</div>}</div>
        </section> : null}
      </div><aside className="central-sidebar"><section><p className="section-kicker">ACESSO RÁPIDO</p>
        <ol className="activity-list"><li><Link href="/contratos">Contratos e obrigações →</Link></li>
          <li><Link href="/ocorrencias">Ocorrências operacionais →</Link></li>
          <li><Link href="/fiscal/entradas">Conferência fiscal →</Link></li></ol>
        <p className="central-scope-note">Esta fila reúne dados do tenant. Responsável nominal ainda não é um vínculo de usuário; não representa uma caixa pessoal de tarefas.</p>
      </section></aside></div>
    </div>
  </AppShell>;
}
