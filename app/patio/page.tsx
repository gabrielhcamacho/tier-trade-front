import { Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../app-shell';
import { currentUserContext } from '../../lib/current-user';
import { formatSchedule, formatWeightKg, loadYardBoard, type LoadDetail } from '../../lib/loads';

export default async function YardPage() {
  const user = await currentUserContext();
  const result = await loadYardBoard(user.identityHeaders);
  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      <main className="operations-board-page">
        <header className="board-page-header"><div><p className="breadcrumbs">Operações <span>›</span> Pátio</p><p className="page-kicker">FLUXO FÍSICO</p><h1>Pátio</h1><p>Cargas aguardando chegada, em movimentação e liberadas.</p></div></header>
        {result.error ? <div className="feedback critical" role="alert">{result.error}</div> : null}
        {result.data ? <>
          <section className="board-metrics" aria-label="Resumo do pátio">
            <article><span>Aguardando chegada</span><strong>{result.data.summary.awaitingArrival}</strong></article>
            <article data-primary="true"><span>No pátio</span><strong>{result.data.summary.inYard}</strong></article>
            <article><span>Saídas registradas</span><strong>{result.data.summary.departed}</strong></article>
            <article data-attention={result.data.summary.openOccurrences > 0}><span>Ocorrências abertas</span><strong>{result.data.summary.openOccurrences}</strong></article>
          </section>
          <section className="board-ledger"><header><div><p className="section-kicker">MOVIMENTAÇÃO</p><h2>Quadro operacional</h2></div><span>{result.data.items.length} carga(s)</span></header>
            <div className="board-table-wrap"><table className="board-table"><thead><tr><th>Carga</th><th>Veículo</th><th>Programação</th><th>Peso previsto</th><th>Local</th><th>Etapa</th><th /></tr></thead><tbody>
              {result.data.items.map((item) => <tr key={item.id}><td className="tt-mono">{item.id.slice(-8)}</td><td><strong>{item.vehiclePlate}</strong><small>{item.carrierName}</small></td><td>{formatSchedule(item.scheduledAt, item.timezone)}</td><td>{formatWeightKg(item.expectedWeightKg)} kg</td><td className="tt-mono">{item.yardLocationCode ?? item.destinationCode}</td><td><Status tone={item.yardState === 'DEPARTED' ? 'positive' : item.openOccurrences ? 'critical' : 'warning'}>{yardStateLabel(item.yardState)}</Status>{item.openOccurrences ? <small>{item.openOccurrences} ocorrência(s)</small> : null}</td><td><Link href={`/cargas/${item.id}`}>Abrir →</Link></td></tr>)}
            </tbody></table></div>
          </section>
        </> : null}
      </main>
    </AppShell>
  );
}

function yardStateLabel(value: LoadDetail['yardState']): string {
  return ({ NOT_ARRIVED: 'Aguardando chegada', CHECKED_IN: 'Check-in', QUEUED: 'Na fila', CALLED_TO_SCALE: 'Na balança', RELEASED: 'Liberada', DEPARTED: 'Saiu do pátio' })[value];
}
