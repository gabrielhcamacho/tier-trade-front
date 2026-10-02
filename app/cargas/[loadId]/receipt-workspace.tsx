'use client';

import { Button, DecimalField, Field, Status } from '@mountier/tier-trade-design-system';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import type { LoadReceipt } from '../../../lib/loads';
import {
  recordReceiptAction,
  startReceivingAction,
  type ReceiptActionState,
} from './actions';

const INITIAL_STATE: ReceiptActionState = { ok: false, message: '' };

export function ReceiptWorkspace({ loadId, status, receipt }: {
  loadId: string;
  status: string;
  receipt: LoadReceipt | null;
}) {
  const router = useRouter();
  const [weighingMode, setWeighingMode] = useState(receipt?.weighingMode ?? 'SCALE');
  const [offset, setOffset] = useState(0);
  const [startState, startAction, starting] = useActionState(startReceivingAction, INITIAL_STATE);
  const [receiptState, receiptAction, saving] = useActionState(recordReceiptAction, INITIAL_STATE);

  useEffect(() => setOffset(new Date().getTimezoneOffset()), []);
  useEffect(() => {
    if (startState.ok || receiptState.ok) router.refresh();
  }, [receiptState.ok, router, startState.ok]);

  if (status === 'SCHEDULED') {
    return (
      <section className="detail-section receiving-start-section">
        <header><div><p className="section-kicker">RECEBIMENTO</p><h2>Chegada da carga</h2></div></header>
        <div className="operational-callout">
          <div><strong>Pronta para iniciar</strong><p>Ao iniciar, a carga entra em recebimento e a pesagem fica disponível para registro.</p></div>
          <form action={startAction}><input type="hidden" name="loadId" value={loadId} /><Button type="submit" disabled={starting}>{starting ? 'Iniciando…' : 'Iniciar recebimento'}</Button></form>
        </div>
        {startState.message ? <ActionFeedback state={startState} /> : null}
      </section>
    );
  }

  if (status === 'CANCELLED') return null;

  return (
    <section className="detail-section receipt-section">
      <header>
        <div><p className="section-kicker">RECEBIMENTO E QUALIDADE</p><h2>{receipt ? 'Registro vigente' : 'Registrar pesagem e classificação'}</h2></div>
        {receipt ? <Status tone={receipt.qualityDecision === 'ACCEPTED' ? 'positive' : 'warning'}>{receipt.qualityDecision === 'ACCEPTED' ? 'Aceita' : 'Revisão necessária'}</Status> : null}
      </header>
      {receipt ? (
        <dl className="receipt-summary">
          <div><dt>Peso bruto</dt><dd>{formatNumber(receipt.grossWeightKg)} kg</dd></div>
          <div><dt>Tara</dt><dd>{formatNumber(receipt.tareWeightKg)} kg</dd></div>
          <div className="receipt-net"><dt>Peso líquido</dt><dd>{formatNumber(receipt.netWeightKg)} kg</dd></div>
          <div><dt>Umidade</dt><dd>{formatNumber(receipt.moisturePct)}%</dd></div>
          <div><dt>Impurezas</dt><dd>{formatNumber(receipt.impurityPct)}%</dd></div>
          <div><dt>Avariados</dt><dd>{formatNumber(receipt.damagedPct)}%</dd></div>
        </dl>
      ) : null}
      <form action={receiptAction} className="receipt-form">
        <input type="hidden" name="loadId" value={loadId} />
        <input type="hidden" name="timezoneOffsetMinutes" value={offset} />
        <Field label="Data e horário do recebimento" required>
          <input name="receivedAtLocal" type="datetime-local" defaultValue={toLocalInput(receipt?.receivedAt)} required />
        </Field>
        <Field label="Origem da pesagem" required>
          <select name="weighingMode" value={weighingMode} onChange={(event) => setWeighingMode(event.target.value as 'SCALE' | 'MANUAL_CONTINGENCY')}>
            <option value="SCALE">Balança / ticket</option>
            <option value="MANUAL_CONTINGENCY">Contingência manual</option>
          </select>
        </Field>
        <DecimalField name="grossWeightKg" label="Peso bruto" suffix="kg" defaultValue={receipt?.grossWeightKg ?? '0'} fractionDigits={3} emptyWhenZero required />
        <DecimalField name="tareWeightKg" label="Tara" suffix="kg" defaultValue={receipt?.tareWeightKg ?? '0'} fractionDigits={3} emptyWhenZero required />
        {weighingMode === 'SCALE' ? (
          <Field label="Número do ticket" required className="field-span-2"><input name="scaleTicketNumber" defaultValue={receipt?.scaleTicketNumber ?? ''} maxLength={80} required /></Field>
        ) : (
          <Field label="Motivo da contingência" required className="field-span-2"><textarea name="contingencyReason" defaultValue={receipt?.contingencyReason ?? ''} minLength={10} maxLength={500} required /></Field>
        )}
        <DecimalField name="moisturePct" label="Umidade" suffix="%" defaultValue={receipt?.moisturePct ?? '0'} fractionDigits={4} emptyWhenZero required />
        <DecimalField name="impurityPct" label="Impurezas" suffix="%" defaultValue={receipt?.impurityPct ?? '0'} fractionDigits={4} emptyWhenZero required />
        <DecimalField name="damagedPct" label="Avariados" suffix="%" defaultValue={receipt?.damagedPct ?? '0'} fractionDigits={4} emptyWhenZero required />
        <Field label="Decisão humana de qualidade" required>
          <select name="qualityDecision" defaultValue={receipt?.qualityDecision ?? 'REVIEW_REQUIRED'}>
            <option value="REVIEW_REQUIRED">Manter em revisão</option>
            <option value="ACCEPTED">Aceitar recebimento</option>
          </select>
        </Field>
        <Field label="Observações" className="field-span-2"><textarea name="notes" defaultValue={receipt?.notes ?? ''} maxLength={1000} /></Field>
        <div className="quality-policy-note field-span-2"><strong>Sem desconto automático</strong><p>Os índices ficam registrados e versionados. O desconto será calculado somente quando a tabela de qualidade do piloto estiver homologada.</p></div>
        {receiptState.message ? <div className="field-span-2"><ActionFeedback state={receiptState} /></div> : null}
        <div className="receipt-form-actions field-span-2"><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : receipt ? 'Salvar nova versão' : 'Registrar recebimento'}</Button></div>
      </form>
    </section>
  );
}

function ActionFeedback({ state }: { state: ReceiptActionState }) {
  return <div className={`feedback ${state.ok ? 'positive' : 'critical'} receipt-feedback`} role={state.ok ? 'status' : 'alert'}>{state.message}</div>;
}

function formatNumber(value: string): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(Number(value));
}

function toLocalInput(value?: string): string {
  const date = value ? new Date(value) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
