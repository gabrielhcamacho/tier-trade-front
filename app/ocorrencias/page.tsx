import { Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../app-shell';
import { currentUserContext } from '../../lib/current-user';
import { formatSchedule, loadOccurrenceBoard, type LoadOccurrence } from '../../lib/loads';

export default async function OccurrencesPage() {
  const user = await currentUserContext();
  const result = await loadOccurrenceBoard(user.identityHeaders);
  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      <main className="operations-board-page">
        <header className="board-page-header"><div><p className="breadcrumbs">Operações <span>›</span> Ocorrências</p><p className="page-kicker">EXCEÇÕES OPERACIONAIS</p><h1>Ocorrências</h1><p>Pendências de documento, peso, qualidade, veículo e pátio.</p></div></header>
        {result.error ? <div className="feedback critical" role="alert">{result.error}</div> : null}
        {result.data ? <>
          <section className="board-metrics board-metrics-three" aria-label="Resumo das ocorrências">
            <article data-attention={result.data.summary.open > 0}><span>Em aberto</span><strong>{result.data.summary.open}</strong></article>
            <article data-critical={result.data.summary.critical > 0}><span>Críticas</span><strong>{result.data.summary.critical}</strong></article>
            <article data-primary="true"><span>Resolvidas</span><strong>{result.data.summary.resolved}</strong></article>
          </section>
          <section className="board-ledger"><header><div><p className="section-kicker">TRIAGEM</p><h2>Fila de ocorrências</h2></div><span>{result.data.items.length} registro(s)</span></header>
            <div className="occurrence-board-list">{result.data.items.map((item) => <article key={item.id} data-severity={item.severity.toLowerCase()}><div className="occurrence-board-copy"><span>{categoryLabel(item.category)} · {item.vehiclePlate}</span><strong>{item.title}</strong><p>{item.description}</p><small>{formatSchedule(item.occurredAt, item.timezone)} · carga <span className="tt-mono">{item.loadId.slice(-8)}</span></small></div><Status tone={item.status === 'RESOLVED' ? 'positive' : item.severity === 'CRITICAL' ? 'critical' : 'warning'}>{item.status === 'RESOLVED' ? 'Resolvida' : severityLabel(item.severity)}</Status><Link href={`/cargas/${item.loadId}#ocorrencias`}>{item.status === 'OPEN' ? 'Tratar' : 'Ver carga'} →</Link></article>)}</div>
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
