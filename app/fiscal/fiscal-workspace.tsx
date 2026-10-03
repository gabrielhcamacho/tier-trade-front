'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { FiscalDocument, FiscalWorkspace } from '../../lib/fiscal';
import { formatFiscalDate, formatFiscalMoney } from '../../lib/fiscal';
import { DemoMetricStrip, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import {
  createFiscalDocumentAction, rejectFiscalDocumentAction, updateFiscalDocumentAction,
  validateFiscalDocumentAction,
} from './actions';

const initialState = { ok: false, message: '' };

export function FiscalWorkspaceView({ data }: { data: FiscalWorkspace }) {
  const [createState, createAction, createPending] = useActionState(createFiscalDocumentAction, initialState);
  const readyEvents = data.eligibleEvents.filter((event) => event.calculationStatus === 'READY');
  const rows = data.documents.map((document) => [
    document.documentNumber,
    document.counterpartyName,
    document.contractReference,
    document.dispatchReference,
    formatFiscalMoney(document.totalAmount),
    <DemoStatus tone={statusTone(document.status)} key={document.id}>{statusLabel(document.status)}</DemoStatus>,
    document.title?.number ?? 'Não vinculado',
  ]);

  return (
    <>
      <DemoMetricStrip items={[
        { label: 'Em conferência', value: String(data.summary.received), detail: 'documentos recebidos', tone: data.summary.received ? 'attention' : undefined },
        { label: 'Validados', value: String(data.summary.validated), detail: 'integridade confirmada', tone: 'primary' },
        { label: 'Rejeitados', value: String(data.summary.rejected), detail: 'histórico preservado' },
        { label: 'Títulos vinculados', value: String(data.summary.linkedTitles), detail: 'cadeia fiscal-financeira' },
      ]} />

      <DemoSection kicker="ENTRADA FISCAL" title="Registrar NF-e de saída" id="entrada" aside="salva no backend e isolada por tenant">
        <form action={createAction} className="fiscal-entry-form">
          <Field label="Expedição com evento financeiro" required>
            <select name="financialEventId" defaultValue="" required>
              <option value="" disabled>Selecione</option>
              {readyEvents.map((event) => <option key={event.id} value={event.id}>
                {event.contractReference} · {event.dispatchReference} · {formatFiscalMoney(event.expectedAmount)}
              </option>)}
            </select>
          </Field>
          <Field label="Número da NF-e" required><input name="documentNumber" placeholder="NFE-000123" required /></Field>
          <Field label="Chave de acesso" hint="44 dígitos; obrigatória para validar.">
            <input name="accessKey" inputMode="numeric" pattern="[0-9]{44}" maxLength={44} placeholder="Digite os 44 dígitos" />
          </Field>
          <Field label="Emissão" required><input type="datetime-local" name="issuedAt" required /></Field>
          <DecimalField name="totalAmount" label="Valor total" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required />
          <Field label="Observações de conferência"><textarea name="validationNotes" rows={2} /></Field>
          <div className="fiscal-entry-action">
            <Feedback state={createState} />
            <Button type="submit" disabled={createPending || readyEvents.length === 0}>
              {createPending ? 'Registrando…' : 'Registrar documento'}
            </Button>
          </div>
        </form>
      </DemoSection>

      <div className="demo-domain-layout fiscal-live-layout">
        <div className="demo-main-stack">
          <DemoSection kicker="REGISTRO FISCAL" title="Documentos e vínculos" id="documentos" aside="expedição → contrato → financeiro">
            {rows.length
              ? <DemoTable label="Documentos fiscais" columns={['Documento', 'Cliente', 'Contrato', 'Expedição', 'Valor', 'Status', 'Título']} rows={rows} />
              : <p>Nenhum documento fiscal recebido para este tenant.</p>}
          </DemoSection>
          {data.documents.map((document) => <FiscalDocumentEditor document={document} key={document.id} />)}
        </div>
        <aside className="demo-side-stack">
          <section><p className="section-kicker">VALIDAÇÃO</p><h2>Conferência sem inferência</h2><p>A validação exige chave de acesso e igualdade exata com o evento financeiro da expedição.</p></section>
          <section><p className="section-kicker">TRIBUTOS</p><h2>Configuração pendente</h2>{data.taxCalculation.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}</section>
          <section><p className="section-kicker">RASTREABILIDADE</p><h2>Cadeia preservada</h2><p>Documento, expedição, contrato, previsão e título permanecem ligados por identificadores persistidos.</p></section>
        </aside>
      </div>
    </>
  );
}

function FiscalDocumentEditor({ document }: { document: FiscalDocument }) {
  const [editState, editAction, editPending] = useActionState(updateFiscalDocumentAction, initialState);
  const [validateState, validateAction, validatePending] = useActionState(validateFiscalDocumentAction, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectFiscalDocumentAction, initialState);
  return (
    <DemoSection kicker="CONFERÊNCIA" title={document.documentNumber} aside={`${document.contractReference} · ${document.counterpartyName}`}>
      <div className="fiscal-document-card">
        <dl className="summary-ledger">
          <div><dt>Valor informado</dt><dd>{formatFiscalMoney(document.totalAmount)}</dd></div>
          <div><dt>Valor esperado</dt><dd>{formatFiscalMoney(document.expectedAmount)}</dd></div>
          <div><dt>Diferença</dt><dd>{formatFiscalMoney(document.differenceAmount)}</dd></div>
          <div><dt>Última atualização</dt><dd>{formatFiscalDate(document.updatedAt)}</dd></div>
        </dl>
        <form action={editAction} className="fiscal-edit-form">
          <input type="hidden" name="documentId" value={document.id} />
          <Field label="Número" required><input name="documentNumber" defaultValue={document.documentNumber} required /></Field>
          <Field label="Chave de acesso"><input name="accessKey" inputMode="numeric" pattern="[0-9]{44}" maxLength={44} defaultValue={document.accessKey ?? ''} /></Field>
          <Field label="Emissão" required><input type="datetime-local" name="issuedAt" defaultValue={toLocalInput(document.issuedAt)} required /></Field>
          <DecimalField name="totalAmount" label="Valor total" prefix="R$" defaultValue={document.totalAmount} fractionDigits={2} required />
          <Field label="Observações"><textarea name="validationNotes" rows={2} defaultValue={document.validationNotes ?? ''} /></Field>
          <div className="fiscal-entry-action"><Feedback state={editState} /><Button type="submit" disabled={editPending}>{editPending ? 'Salvando…' : 'Salvar correção'}</Button></div>
        </form>
        <div className="fiscal-decision-grid">
          <form action={validateAction}>
            <input type="hidden" name="documentId" value={document.id} />
            <Feedback state={validateState} />
            <Button type="submit" disabled={validatePending || document.status === 'VALIDATED'}>{validatePending ? 'Validando…' : 'Validar e vincular título'}</Button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="documentId" value={document.id} />
            <Field label="Motivo da rejeição" required><textarea name="reason" minLength={3} maxLength={500} rows={2} required /></Field>
            <Feedback state={rejectState} />
            <Button type="submit" disabled={rejectPending}>{rejectPending ? 'Rejeitando…' : 'Rejeitar documento'}</Button>
          </form>
        </div>
      </div>
    </DemoSection>
  );
}

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null;
}

function toLocalInput(value: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: 'America/Sao_Paulo',
  }).format(new Date(value)).replace(' ', 'T');
}

function statusLabel(status: FiscalDocument['status']): string {
  if (status === 'VALIDATED') return 'Validado';
  if (status === 'REJECTED') return 'Rejeitado';
  return 'Em conferência';
}

function statusTone(status: FiscalDocument['status']): 'positive' | 'critical' | 'attention' {
  if (status === 'VALIDATED') return 'positive';
  if (status === 'REJECTED') return 'critical';
  return 'attention';
}
