import { Status } from '@mountier/tier-trade-design-system';
import { ReportFilterBar } from '../report-filter-bar';
import { AppShell } from '../app-shell';
import { ClickableTableRow } from '../clickable-table-row';
import { EmptyState, PageFeedback } from '../page-state';
import { currentUserContext } from '../../lib/current-user';
import { formatPercent, formatSchedule, loadQualityBoard } from '../../lib/loads';

export default async function QualityPage() {
  const user = await currentUserContext();
  const result = await loadQualityBoard(user.identityHeaders);
  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      <main className="operations-board-page">
        <header className="board-page-header"><div><p className="breadcrumbs">Operações <span>›</span> Qualidade</p><p className="page-kicker">CLASSIFICAÇÃO</p><h1>Qualidade</h1><p>Decisões humanas e resultados de classificação preservados por versão do recebimento.</p></div></header>
        <ReportFilterBar action="/operacoes/relatorio" defaultType="qualidade" types={[{ value: 'qualidade', label: 'Qualidade' }]} criterionPlaceholder="Veículo, ticket, decisão…" />
        {result.error ? <PageFeedback title="Não foi possível carregar a qualidade" message={result.error} action={{ href: '/qualidade', label: 'Tentar novamente' }} /> : null}
        {result.data ? <>
          <section className="board-metrics" aria-label="Resumo da qualidade">
            <article><span>Aguardando classificação</span><strong>{result.data.summary.awaitingClassification}</strong></article>
            <article data-attention={result.data.summary.reviewRequired > 0}><span>Em revisão</span><strong>{result.data.summary.reviewRequired}</strong></article>
            <article data-primary="true"><span>Aceitas</span><strong>{result.data.summary.accepted}</strong></article>
            <article><span>Médias</span><strong>{formatPercent(result.data.summary.averageMoisturePct)}</strong><small>umidade · {formatPercent(result.data.summary.averageImpurityPct)} impurezas</small></article>
          </section>
          <section className="board-ledger"><header><div><p className="section-kicker">LAUDOS E DECISÕES</p><h2>Classificação por carga</h2></div><span>{result.data.items.length} carga(s)</span></header>
            {result.data.items.length === 0 ? <EmptyState compact eyebrow="SEM CLASSIFICAÇÕES" title="Nenhuma carga aguardando qualidade" description="As cargas recebidas aparecerão aqui para registro e revisão dos indicadores de qualidade." action={{ href: '/recebimentos', label: 'Abrir recebimentos' }} /> : <div className="board-table-wrap"><table className="board-table"><thead><tr><th>Carga</th><th>Veículo</th><th>Programação</th><th>Ticket</th><th>Umidade</th><th>Impurezas</th><th>Avariados</th><th>Quebrados</th><th>Queimados</th><th>Ardidos</th><th>Decisão</th></tr></thead><tbody>
              {result.data.items.map((item) => <ClickableTableRow key={item.id} href={`/cargas/${item.id}#recebimento`} label={`${item.receipt ? 'Abrir classificação da' : 'Classificar'} carga ${item.vehiclePlate}`}><td className="tt-mono">{item.id.slice(-8)}</td><td><strong>{item.vehiclePlate}</strong><small>{item.carrierName}</small></td><td>{formatSchedule(item.scheduledAt, item.timezone)}</td><td>{item.receipt?.scaleTicketNumber ?? '—'}</td><td>{formatPercent(item.receipt?.moisturePct ?? null)}</td><td>{formatPercent(item.receipt?.impurityPct ?? null)}</td><td>{formatPercent(item.receipt?.damagedPct ?? null)}</td><td>{formatPercent(item.receipt?.brokenPct ?? null)}</td><td>{formatPercent(item.receipt?.burntPct ?? null)}</td><td>{formatPercent(item.receipt?.heatDamagedPct ?? null)}</td><td><Status tone={item.receipt?.qualityDecision === 'ACCEPTED' ? 'positive' : item.receipt?.qualityDecision === 'REVIEW_REQUIRED' ? 'warning' : 'neutral'}>{qualityLabel(item.receipt?.qualityDecision)}</Status></td></ClickableTableRow>)}
            </tbody></table></div>}
          </section>
        </> : null}
      </main>
    </AppShell>
  );
}

function qualityLabel(value: 'ACCEPTED' | 'REVIEW_REQUIRED' | undefined) {
  if (value === 'ACCEPTED') return 'Aceita';
  if (value === 'REVIEW_REQUIRED') return 'Em revisão';
  return 'Pendente';
}
