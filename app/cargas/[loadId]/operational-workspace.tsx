'use client';

import { Button, Field, Status } from '@mountier/tier-trade-design-system';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import type { LoadDetail, LoadOccurrence, YardEvent } from '../../../lib/loads';
import { formatSchedule, formatWeightKg } from '../../../lib/loads';
import {
  createOccurrenceAction,
  issueRomaneioAction,
  recordYardEventAction,
  resolveOccurrenceAction,
  type ReceiptActionState,
} from './actions';

const INITIAL_STATE: ReceiptActionState = { ok: false, message: '' };

const YARD_NEXT: Record<LoadDetail['yardState'], YardEvent['eventType'] | null> = {
  NOT_ARRIVED: null,
  CHECKED_IN: 'QUEUED',
  QUEUED: 'CALLED_TO_SCALE',
  CALLED_TO_SCALE: 'RELEASED',
  RELEASED: 'DEPARTED',
  DEPARTED: null,
};

export function OperationalWorkspace({ load }: { load: LoadDetail }) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [yardState, yardAction, yardPending] = useActionState(recordYardEventAction, INITIAL_STATE);
  const [occurrenceState, occurrenceAction, occurrencePending] = useActionState(createOccurrenceAction, INITIAL_STATE);
  const [romaneioState, romaneioAction, romaneioPending] = useActionState(issueRomaneioAction, INITIAL_STATE);
  const nextYardEvent = YARD_NEXT[load.yardState];
  const accepted = load.receipt?.qualityDecision === 'ACCEPTED';
  const reportOutdated = Boolean(load.romaneio && load.receipt && load.romaneio.receiptId !== load.receipt.id);

  useEffect(() => setOffset(new Date().getTimezoneOffset()), []);
  useEffect(() => {
    if (yardState.ok || occurrenceState.ok || romaneioState.ok) router.refresh();
  }, [occurrenceState.ok, romaneioState.ok, router, yardState.ok]);

  return (
    <>
      <section className="detail-section yard-section" id="patio">
        <header>
          <div><p className="section-kicker">PÁTIO</p><h2>Passagem da carga</h2></div>
          <Status tone={load.yardState === 'DEPARTED' ? 'positive' : 'warning'}>{yardStateLabel(load.yardState)}</Status>
        </header>
        {load.yardEvents.length ? (
          <ol className="yard-timeline">
            {load.yardEvents.map((event) => (
              <li key={event.id}>
                <span aria-hidden="true" />
                <div><strong>{yardStateLabel(event.eventType)}</strong><small>{formatSchedule(event.occurredAt, load.timezone)}{event.locationCode ? ` · ${event.locationCode}` : ''}</small>{event.notes ? <p>{event.notes}</p> : null}</div>
              </li>
            ))}
          </ol>
        ) : <p className="detail-empty">A chegada ainda não foi registrada. Inicie o recebimento para abrir a passagem no pátio.</p>}
        {nextYardEvent ? (
          <form action={yardAction} className="yard-action-form">
            <input type="hidden" name="loadId" value={load.id} />
            <input type="hidden" name="eventType" value={nextYardEvent} />
            <input type="hidden" name="timezoneOffsetMinutes" value={offset} />
            <Field label="Data e horário" required><input type="datetime-local" name="occurredAtLocal" defaultValue={toLocalInput()} required /></Field>
            <Field label="Local do pátio"><input name="locationCode" placeholder="PATIO_A ou BALANCA_01" maxLength={32} /></Field>
            <Field label="Observação" className="field-span-2"><input name="notes" maxLength={500} placeholder="Opcional" /></Field>
            <div className="field-span-2 operational-form-action">
              <Button type="submit" disabled={yardPending || (nextYardEvent === 'RELEASED' && !accepted)}>
                {yardPending ? 'Registrando…' : yardActionLabel(nextYardEvent)}
              </Button>
              {nextYardEvent === 'RELEASED' && !accepted ? <small>A liberação será habilitada após o aceite do recebimento.</small> : null}
            </div>
          </form>
        ) : null}
        {yardState.message ? <ActionFeedback state={yardState} /> : null}
      </section>

      <section className="detail-section occurrence-section" id="ocorrencias">
        <header><div><p className="section-kicker">OCORRÊNCIAS</p><h2>Exceções operacionais</h2></div><span className="section-meta">{load.occurrences.filter((item) => item.status === 'OPEN').length} aberta(s)</span></header>
        <div className="occurrence-list">
          {load.occurrences.map((occurrence) => <OccurrenceCard key={occurrence.id} loadId={load.id} occurrence={occurrence} timezone={load.timezone} />)}
          {!load.occurrences.length ? <p className="detail-empty">Nenhuma ocorrência registrada para esta carga.</p> : null}
        </div>
        <form action={occurrenceAction} className="occurrence-form">
          <input type="hidden" name="loadId" value={load.id} />
          <input type="hidden" name="timezoneOffsetMinutes" value={offset} />
          <Field label="Categoria" required><select name="category" defaultValue="YARD"><option value="DOCUMENT">Documento</option><option value="WEIGHT">Peso</option><option value="QUALITY">Qualidade</option><option value="VEHICLE">Veículo</option><option value="YARD">Pátio</option><option value="OTHER">Outra</option></select></Field>
          <Field label="Severidade" required><select name="severity" defaultValue="WARNING"><option value="INFO">Informativa</option><option value="WARNING">Atenção</option><option value="CRITICAL">Crítica</option></select></Field>
          <Field label="Data e horário" required><input type="datetime-local" name="occurredAtLocal" defaultValue={toLocalInput()} required /></Field>
          <Field label="Título" required><input name="title" minLength={3} maxLength={120} required /></Field>
          <Field label="Descrição" className="field-span-2" required><textarea name="description" minLength={10} maxLength={1000} required /></Field>
          {occurrenceState.message ? <div className="field-span-2"><ActionFeedback state={occurrenceState} /></div> : null}
          <div className="field-span-2 operational-form-action"><Button type="submit" disabled={occurrencePending}>{occurrencePending ? 'Registrando…' : 'Registrar ocorrência'}</Button></div>
        </form>
      </section>

      <section className="detail-section romaneio-section" id="romaneio">
        <header>
          <div><p className="section-kicker">DOCUMENTO OPERACIONAL</p><h2>Romaneio de recebimento</h2></div>
          {load.romaneio ? <Status tone={reportOutdated ? 'warning' : 'positive'}>{reportOutdated ? 'Nova versão necessária' : 'Emitido'}</Status> : <Status tone="neutral">Pendente</Status>}
        </header>
        {load.romaneio ? (
          <article className="romaneio-document">
            <div className="romaneio-heading"><div><span>ROMANEIO</span><strong className="tt-mono">{load.romaneio.reference}</strong></div><small>Versão {load.romaneio.version} · emitido em {formatSchedule(load.romaneio.issuedAt, load.timezone)}</small></div>
            <dl className="detail-data-grid">
              <div><dt>NF de entrada</dt><dd>{load.romaneio.inboundInvoiceNumber} · série {load.romaneio.inboundInvoiceSeries}</dd></div>
              <div><dt>Ticket da balança</dt><dd>{load.romaneio.scaleTicketNumber ?? 'Contingência manual'}</dd></div>
              <div><dt>Peso documental</dt><dd>{formatWeightKg(load.romaneio.documentWeightKg)} kg</dd></div>
              <div><dt>Peso de chegada</dt><dd>{formatWeightKg(load.romaneio.arrivalWeightKg)} kg</dd></div>
              <div><dt>Peso considerado</dt><dd>{formatWeightKg(load.romaneio.consideredWeightKg)} kg</dd></div>
              <div><dt>Peso aceito</dt><dd>{formatWeightKg(load.romaneio.acceptedWeightKg)} kg</dd></div>
              <div><dt>Umidade</dt><dd>{formatWeightKg(load.romaneio.moisturePct)}%</dd></div>
              <div><dt>Impurezas / avariados</dt><dd>{formatWeightKg(load.romaneio.impurityPct)}% / {formatWeightKg(load.romaneio.damagedPct)}%</dd></div>
            </dl>
            <button className="tt-button romaneio-print" data-variant="secondary" data-size="md" type="button" onClick={() => window.print()}>Imprimir romaneio</button>
          </article>
        ) : <p className="detail-empty">O romaneio será gerado a partir da versão aceita do recebimento, preservando NF, balança, pesos e qualidade.</p>}
        {accepted && (!load.romaneio || reportOutdated) ? (
          <form action={romaneioAction} className="romaneio-action"><input type="hidden" name="loadId" value={load.id} /><Button type="submit" disabled={romaneioPending}>{romaneioPending ? 'Emitindo…' : reportOutdated ? 'Emitir nova versão' : 'Emitir romaneio'}</Button></form>
        ) : null}
        {!accepted ? <p className="operational-guard">Ação bloqueada até a decisão de qualidade ser aceita.</p> : null}
        {romaneioState.message ? <ActionFeedback state={romaneioState} /> : null}
      </section>
    </>
  );
}

function OccurrenceCard({ loadId, occurrence, timezone }: { loadId: string; occurrence: LoadOccurrence; timezone: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(resolveOccurrenceAction, INITIAL_STATE);
  useEffect(() => { if (state.ok) router.refresh(); }, [router, state.ok]);
  return (
    <article className="occurrence-card" data-severity={occurrence.severity.toLowerCase()}>
      <header><div><span>{categoryLabel(occurrence.category)}</span><strong>{occurrence.title}</strong></div><Status tone={occurrence.status === 'RESOLVED' ? 'positive' : occurrence.severity === 'CRITICAL' ? 'critical' : 'warning'}>{occurrence.status === 'RESOLVED' ? 'Resolvida' : severityLabel(occurrence.severity)}</Status></header>
      <p>{occurrence.description}</p><small>{formatSchedule(occurrence.occurredAt, timezone)}</small>
      {occurrence.resolution ? <div className="occurrence-resolution"><strong>Resolução</strong><p>{occurrence.resolution}</p></div> : null}
      {occurrence.status === 'OPEN' ? <form action={action} className="occurrence-resolution-form"><input type="hidden" name="loadId" value={loadId} /><input type="hidden" name="occurrenceId" value={occurrence.id} /><Field label="Como foi resolvida" required><textarea name="resolution" minLength={10} maxLength={1000} required /></Field><Button type="submit" disabled={pending}>{pending ? 'Resolvendo…' : 'Resolver ocorrência'}</Button>{state.message ? <ActionFeedback state={state} /> : null}</form> : null}
    </article>
  );
}

function ActionFeedback({ state }: { state: ReceiptActionState }) {
  return <div className={`feedback ${state.ok ? 'positive' : 'critical'} operational-feedback`} role={state.ok ? 'status' : 'alert'}>{state.message}</div>;
}

function toLocalInput(): string {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function yardStateLabel(value: LoadDetail['yardState']): string {
  return ({ NOT_ARRIVED: 'Aguardando chegada', CHECKED_IN: 'Check-in realizado', QUEUED: 'Na fila do pátio', CALLED_TO_SCALE: 'Chamada para balança', RELEASED: 'Liberada', DEPARTED: 'Saída registrada' })[value];
}

function yardActionLabel(value: YardEvent['eventType']): string {
  return ({ CHECKED_IN: 'Registrar chegada', QUEUED: 'Enviar para a fila', CALLED_TO_SCALE: 'Chamar para a balança', RELEASED: 'Liberar carga', DEPARTED: 'Registrar saída' })[value];
}

function categoryLabel(value: LoadOccurrence['category']): string {
  return ({ DOCUMENT: 'Documento', WEIGHT: 'Peso', QUALITY: 'Qualidade', VEHICLE: 'Veículo', YARD: 'Pátio', OTHER: 'Outra' })[value];
}

function severityLabel(value: LoadOccurrence['severity']): string {
  return ({ INFO: 'Informativa', WARNING: 'Atenção', CRITICAL: 'Crítica' })[value];
}
