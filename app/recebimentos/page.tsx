import { Status } from '@mountier/tier-trade-design-system';
import { AppShell } from '../app-shell';
import { ClickableTableRow } from '../clickable-table-row';
import { EmptyState, PageFeedback } from '../page-state';
import { currentUserContext } from '../../lib/current-user';
import { formatSchedule, formatWeightKg, loadReceivingBoard, loadStatusLabel } from '../../lib/loads';

export default async function ReceivingPage() {
  const user = await currentUserContext();
  const result = await loadReceivingBoard(user.identityHeaders);
  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      <main className="operations-board-page">
        <header className="board-page-header"><div><p className="breadcrumbs">Operações <span>›</span> Recebimento</p><p className="page-kicker">NOTA FISCAL E PESAGEM</p><h1>Recebimento</h1><p>Conciliação explícita entre documento, balança, aceite operacional e estoque.</p></div></header>
        {result.error ? <PageFeedback title="Não foi possível carregar os recebimentos" message={result.error} action={{ href: '/recebimentos', label: 'Tentar novamente' }} /> : null}
        {result.data ? <>
          <section className="board-metrics" aria-label="Resumo dos recebimentos">
            <article><span>Programadas</span><strong>{result.data.summary.scheduled}</strong></article>
            <article data-attention={result.data.summary.inReceiving > 0}><span>Em recebimento</span><strong>{result.data.summary.inReceiving}</strong></article>
            <article data-primary="true"><span>Recebidas</span><strong>{result.data.summary.received}</strong></article>
            <article><span>Peso aceito</span><strong>{formatWeightKg(result.data.summary.acceptedWeightKg)} <em>kg</em></strong></article>
          </section>
          <section className="board-ledger"><header><div><p className="section-kicker">CONCILIAÇÃO</p><h2>Cargas e documentos</h2></div><span>{result.data.items.length} carga(s)</span></header>
            {result.data.items.length === 0 ? <EmptyState compact eyebrow="SEM RECEBIMENTOS" title="Nenhuma carga disponível para conferência" description="Programe uma carga no contrato para iniciar a entrada fiscal, a pesagem e o aceite operacional." action={{ href: '/cargas', label: 'Abrir agenda de cargas' }} /> : <div className="board-table-wrap"><table className="board-table"><thead><tr><th>Carga</th><th>Veículo</th><th>Programação</th><th>NF de entrada</th><th>Documento</th><th>Balança</th><th>Aceito</th><th>Situação</th></tr></thead><tbody>
              {result.data.items.map((item) => <ClickableTableRow key={item.id} href={`/cargas/${item.id}#recebimento`} label={`${item.receipt ? 'Conferir' : 'Receber'} carga ${item.vehiclePlate}`}><td className="tt-mono">{item.id.slice(-8)}</td><td><strong>{item.vehiclePlate}</strong><small>{item.carrierName}</small></td><td>{formatSchedule(item.scheduledAt, item.timezone)}</td><td>{item.receipt?.inboundInvoiceNumber ?? '—'}</td><td>{weight(item.receipt?.documentWeightKg)}</td><td>{weight(item.receipt?.arrivalWeightKg)}</td><td>{weight(item.receipt?.acceptedWeightKg)}</td><td><Status tone={item.status === 'RECEIVED' ? 'positive' : item.status === 'IN_RECEIVING' ? 'warning' : 'neutral'}>{loadStatusLabel(item.status)}</Status>{item.openOccurrences ? <small>{item.openOccurrences} ocorrência(s)</small> : null}</td></ClickableTableRow>)}
            </tbody></table></div>}
          </section>
        </> : null}
      </main>
    </AppShell>
  );
}

function weight(value: string | null | undefined) {
  return value ? `${formatWeightKg(value)} kg` : '—';
}
