import { Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { DetailNavigation } from '../../detail-navigation';
import { DemoLoadDetail } from './demo-load-detail';
import { currentUserContext } from '../../../lib/current-user';
import { loadDocuments, type StoredDocument } from '../../../lib/documents';
import { DocumentPanel } from '../../documents/document-panel';
import { commodityLabel, formatDate, loadContractSummary, type ContractSummary } from '../../../lib/contracts';
import { formatSchedule, formatWeightKg, loadLoadDetail, loadStatusLabel, type LoadDetail as LoadDetailData } from '../../../lib/loads';
import { ReceiptWorkspace } from './receipt-workspace';
import { OperationalWorkspace } from './operational-workspace';
import { ScheduleControls } from './schedule-controls';

export default async function LoadDetailPage({ params, searchParams }: {
  params: Promise<{ loadId: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const [{ loadId }, { modo }, user] = await Promise.all([params, searchParams, currentUserContext()]);
  if (modo === 'demonstracao') return <AppShell activeDomain="operations" userLabel={user.userLabel}><DemoLoadDetail loadId={loadId} /></AppShell>;

  const [loadResult, documentResult] = await Promise.all([
    loadLoadDetail(loadId, user.identityHeaders),
    loadDocuments(user.identityHeaders, 'LOAD', loadId),
  ]);
  const contractResult = loadResult.data ? await loadContractSummary(loadResult.data.contractId, user.identityHeaders) : null;

  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      {loadResult.error ? <LoadError message={loadResult.error} /> : null}
      {contractResult?.error ? <LoadError message={contractResult.error} /> : null}
      {loadResult.data && contractResult?.summary ? <LoadDetail load={loadResult.data} summary={contractResult.summary} documents={documentResult.items} documentError={documentResult.error} /> : null}
    </AppShell>
  );
}

function LoadError({ message }: { message: string }) {
  return <div className="feedback critical detail-feedback" role="alert"><strong>Não foi possível abrir a carga</strong><span>{message}</span><Link href="/cargas">Voltar à agenda</Link></div>;
}

function LoadDetail({ load, summary, documents, documentError }: {
  load: LoadDetailData; summary: ContractSummary; documents: StoredDocument[]; documentError: string | null;
}) {
  const hasReceipt = Boolean(load.receipt);
  const accepted = load.receipt?.qualityDecision === 'ACCEPTED';
  return (
    <>
      <header className="entity-header load-entity-header">
        <DetailNavigation backHref={`/cargas?contractId=${summary.id}`} backLabel="Voltar às cargas" items={[{ label: 'Operações', href: '/cargas' }, { label: 'Cargas', href: `/cargas?contractId=${summary.id}` }, { label: load.id.slice(-8), mono: true }]} />
        <div className="entity-title-row">
          <div><p className="entity-kind">Carga de recebimento</p><h1>{load.vehiclePlate}</h1><p className="entity-id tt-mono">Carga {load.id}</p></div>
          <div className="entity-actions"><Status tone="positive">{loadStatusLabel(load.status)}</Status></div>
        </div>
        <dl className="entity-facts">
          <div><dt>Contrato</dt><dd><Link className="tt-mono" href={`/contratos/${summary.id}`}>{summary.id}</Link> · v{load.contractVersionNumber}</dd></div>
          <div><dt>Commodity</dt><dd>{commodityLabel(summary.commodity)}</dd></div>
          <div><dt>Programação</dt><dd>{formatSchedule(load.scheduledAt, load.timezone)}</dd></div>
          <div><dt>Peso previsto</dt><dd>{formatWeightKg(load.expectedWeightKg)} kg</dd></div>
          <div><dt>Destino</dt><dd>{load.destinationCode}</dd></div>
        </dl>
        <ol className="trace-rail" aria-label="Etapas da carga">
          <TraceStep label="Programação" detail="Concluída" state="done" />
          <TraceStep label="Pesagem" detail={hasReceipt ? 'Registrada' : load.status === 'IN_RECEIVING' ? 'Em andamento' : '—'} state={hasReceipt ? 'done' : load.status === 'IN_RECEIVING' ? 'current' : 'future'} />
          <TraceStep label="Classificação" detail={accepted ? 'Aceita' : hasReceipt ? 'Em revisão' : '—'} state={accepted ? 'done' : hasReceipt ? 'current' : 'future'} />
          <TraceStep label="Romaneio" detail={load.romaneio ? `v${load.romaneio.version}` : '—'} state={load.romaneio ? 'done' : accepted ? 'current' : 'future'} />
          <TraceStep label="NF-e" detail={load.receipt?.inboundInvoiceNumber ?? '—'} state={hasReceipt ? 'done' : 'future'} />
          <TraceStep label="Liquidação" />
        </ol>
      </header>

      <div className="load-detail-layout">
        <div className="load-main-column">
          <section className="detail-section load-programming-section">
            <header><div><p className="section-kicker">PROGRAMAÇÃO</p><h2>Dados previstos</h2></div><Status tone={load.status === 'CANCELLED' ? 'neutral' : 'positive'}>{load.status === 'CANCELLED' ? 'Saldo liberado' : 'Saldo reservado'}</Status></header>
            <dl className="detail-data-grid">
              <div><dt>Data e horário</dt><dd>{formatSchedule(load.scheduledAt, load.timezone)}</dd></div><div><dt>Veículo</dt><dd>{load.vehiclePlate}</dd></div>
              <div><dt>Transportadora</dt><dd>{load.carrierName}</dd></div><div><dt>Destino</dt><dd>{load.destinationCode}</dd></div>
              <div><dt>Peso previsto</dt><dd>{formatWeightKg(load.expectedWeightKg)} kg</dd></div><div><dt>Janela do contrato</dt><dd>{formatDate(summary.delivery_start)} a {formatDate(summary.delivery_end)}</dd></div>
            </dl>
            <ScheduleControls load={load} deliveryStart={summary.delivery_start} deliveryEnd={summary.delivery_end} />
          </section>
          <ReceiptWorkspace key={`${load.id}-${load.receipt?.version ?? 0}`} loadId={load.id} status={load.status} receipt={load.receipt} />
          <OperationalWorkspace load={load} />
          <DocumentPanel
            aggregateType="LOAD"
            aggregateId={load.id}
            documents={documents}
            error={documentError}
            returnPath={`/cargas/${load.id}`}
            sectionId="documentos"
            allowedDocumentTypes={['ROMANEIO', 'QUALITY_REPORT', 'WEIGHING_TICKET', 'INVOICE', 'OTHER']}
          />
        </div>

        <aside className="load-side-column" aria-label="Relações e histórico da carga">
          <section><p className="section-kicker">OBJETOS VINCULADOS</p><h2>Rastreabilidade</h2><dl className="linked-object-list">
            <div><dt>Contrato</dt><dd><Link className="tt-mono" href={`/contratos/${summary.id}`}>{summary.id}</Link> · versão {load.contractVersionNumber}</dd></div><div><dt>Romaneio</dt><dd>{load.romaneio ? `${load.romaneio.reference} · v${load.romaneio.version}` : 'Ainda não existe'}</dd></div><div><dt>NF-e</dt><dd>{load.receipt?.inboundInvoiceNumber ?? 'Ainda não existe'}</dd></div><div><dt>Pátio</dt><dd>{yardStateLabel(load.yardState)}</dd></div><div><dt>Liquidação</dt><dd>Ainda não existe</dd></div>
          </dl></section>
          <section><p className="section-kicker">HISTÓRICO DA CARGA</p><h2>Eventos</h2>{load.events.length ? load.events.map((event, index) => <div className="load-history-item" key={`${event.type}-${event.occurredAt}-${index}`}><span aria-hidden="true" /><div><strong>{eventLabel(event.type)}</strong><p>{eventDescription(event.type, event.payload)}</p><small>{formatSchedule(event.occurredAt, load.timezone)}</small></div></div>) : <div className="load-history-item"><span aria-hidden="true" /><div><strong>Carga programada</strong><p>Saldo reservado no contrato para {formatWeightKg(load.expectedWeightKg)} kg.</p><small>{formatSchedule(load.createdAt, load.timezone)}</small></div></div>}</section>
        </aside>
      </div>
    </>
  );
}

function TraceStep({ label, detail = '—', state = 'future' }: { label: string; detail?: string; state?: 'done' | 'current' | 'future' }) {
  return <li data-state={state}><span aria-hidden="true" /><div><strong>{label}</strong><small>{detail}</small></div></li>;
}

function eventLabel(type: string): string {
  if (type === 'load.scheduled') return 'Carga programada';
  if (type === 'load.rescheduled') return 'Carga reprogramada';
  if (type === 'load.cancelled') return 'Carga cancelada';
  if (type === 'load.receiving_started') return 'Recebimento iniciado';
  if (type === 'load.receipt_recorded') return 'Pesagem e qualidade registradas';
  if (type === 'load.receipt_corrected') return 'Registro corrigido';
  if (type === 'load.yard_event_recorded') return 'Movimentação no pátio';
  if (type === 'load.occurrence_created') return 'Ocorrência registrada';
  if (type === 'load.occurrence_resolved') return 'Ocorrência resolvida';
  if (type === 'load.romaneio_issued') return 'Romaneio emitido';
  if (type === 'load.romaneio_corrected') return 'Nova versão do romaneio';
  return type;
}

function eventDescription(type: string, payload: Record<string, unknown>): string {
  if (type === 'load.scheduled') return `Saldo reservado para ${String(payload.expectedWeightKg ?? '—')} kg.`;
  if (type === 'load.rescheduled') return `Motivo: ${String(payload.reason ?? '—')}.`;
  if (type === 'load.cancelled') return `Motivo: ${String(payload.reason ?? '—')}. Peso liberado: ${String(payload.releasedWeightKg ?? '—')} kg.`;
  if (type === 'load.receiving_started') return 'A carga entrou no fluxo de recebimento.';
  if (type === 'load.receipt_recorded' || type === 'load.receipt_corrected') {
    return `Versão ${String(payload.version ?? '—')} · peso líquido ${String(payload.netWeightKg ?? '—')} kg · ${payload.qualityDecision === 'ACCEPTED' ? 'aceita' : 'em revisão'}.`;
  }
  if (type === 'load.yard_event_recorded') return `Etapa ${String(payload.eventType ?? '—')} registrada${payload.locationCode ? ` em ${String(payload.locationCode)}` : ''}.`;
  if (type === 'load.occurrence_created') return `${String(payload.title ?? 'Ocorrência')} · ${String(payload.severity ?? '—')}.`;
  if (type === 'load.occurrence_resolved') return 'A ocorrência foi resolvida sem remover seu registro original.';
  if (type === 'load.romaneio_issued' || type === 'load.romaneio_corrected') return `${String(payload.reference ?? 'Romaneio')} · versão ${String(payload.version ?? '—')}.`;
  return 'Evento operacional auditado.';
}

function yardStateLabel(value: LoadDetailData['yardState']): string {
  return ({ NOT_ARRIVED: 'Aguardando chegada', CHECKED_IN: 'Check-in realizado', QUEUED: 'Na fila', CALLED_TO_SCALE: 'Na balança', RELEASED: 'Liberada', DEPARTED: 'Saída registrada' })[value];
}
