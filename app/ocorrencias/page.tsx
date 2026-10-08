import { Status } from '@mountier/tier-trade-design-system';
import { ReportFilterBar } from '../report-filter-bar';
import { AppShell } from '../app-shell';
import { ClickableSurface } from '../clickable-surface';
import { EmptyState, PageFeedback } from '../page-state';
import { currentUserContext } from '../../lib/current-user';
import { formatSchedule, loadOccurrenceBoard, type LoadOccurrence } from '../../lib/loads';

export default async function OccurrencesPage() {
  const user = await currentUserContext();
  const result = await loadOccurrenceBoard(user.identityHeaders);
  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      <main className="operations-board-page">
        <header className="board-page-header"><div><p className="breadcrumbs">Operações <span>›</span> Ocorrências</p><p className="page-kicker">EXCEÇÕES OPERACIONAIS</p><h1>Ocorrências</h1><p>Pendências de documento, peso, qualidade, veículo e pátio.</p></div></header>
        <ReportFilterBar action="/operacoes/relatorio" defaultType="ocorrencias" types={[{ value: 'ocorrencias', label: 'Ocorrências' }]} criterionPlaceholder="Categoria, severidade, status…" />
        {result.error ? <PageFeedback title="Não foi possível carregar as ocorrências" message={result.error} action={{ href: '/ocorrencias', label: 'Tentar novamente' }} /> : null}
        {result.data ? <>
          <section className="board-metrics board-metrics-three" aria-label="Resumo das ocorrências">
            <article data-attention={result.data.summary.open > 0}><span>Em aberto</span><strong>{result.data.summary.open}</strong></article>
            <article data-critical={result.data.summary.critical > 0}><span>Críticas</span><strong>{result.data.summary.critical}</strong></article>
            <article data-primary="true"><span>Resolvidas</span><strong>{result.data.summary.resolved}</strong></article>
          </section>
          <section className="board-ledger"><header><div><p className="section-kicker">TRIAGEM</p><h2>Fila de ocorrências</h2></div><span>{result.data.items.length} registro(s)</span></header>
            {result.data.items.length === 0 ? <EmptyState compact eyebrow="SEM OCORRÊNCIAS" title="Nenhuma exceção operacional registrada" description="Novas ocorrências de documento, peso, qualidade, veículo ou pátio aparecerão nesta fila." action={{ href: '/cargas', label: 'Abrir agenda de cargas' }} /> : <div className="occurrence-board-list">{result.data.items.map((item) => <ClickableSurface key={item.id} data-severity={item.severity.toLowerCase()} href={`/cargas/${item.loadId}#ocorrencias`} label={`${item.status === 'OPEN' ? 'Tratar' : 'Ver'} ocorrência ${item.title}`}><div className="occurrence-board-copy"><span>{categoryLabel(item.category)} · {item.vehiclePlate}</span><strong>{item.title}</strong><p>{item.description}</p><small>{formatSchedule(item.occurredAt, item.timezone)} · carga <span className="tt-mono">{item.loadId.slice(-8)}</span></small></div><Status tone={item.status === 'RESOLVED' ? 'positive' : item.severity === 'CRITICAL' ? 'critical' : 'warning'}>{item.status === 'RESOLVED' ? 'Resolvida' : severityLabel(item.severity)}</Status><span className="clickable-surface-action" aria-hidden="true">{item.status === 'OPEN' ? 'Tratar' : 'Ver carga'} →</span></ClickableSurface>)}</div>}
          </section>
        </> : null}
      </main>
    </AppShell>
  );
}

function categoryLabel(value: LoadOccurrence['category']): string {
  return ({ DOCUMENT: 'Documento', WEIGHT: 'Peso', QUALITY: 'Qualidade', VEHICLE: 'Veículo', YARD: 'Pátio', OTHER: 'Outra' })[value];
}

function severityLabel(value: LoadOccurrence['severity']): string {
  return ({ INFO: 'Informativa', WARNING: 'Atenção', CRITICAL: 'Crítica' })[value];
}
