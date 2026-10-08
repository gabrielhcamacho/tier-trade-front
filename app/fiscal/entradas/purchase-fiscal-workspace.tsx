'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState, useMemo, useState } from 'react';
import type { FiscalWorkspace } from '../../../lib/fiscal';
import { formatFiscalDate, formatFiscalMoney } from '../../../lib/fiscal';
import { DemoMetricStrip, DemoSection, DemoStatus, DemoTable } from '../../demo-ui';
import { EmptyState } from '../../page-state';
import {
  createPurchaseFiscalDocumentAction, rejectFiscalDocumentAction, updateFiscalDocumentAction,
  validateFiscalDocumentAction,
} from '../actions';

const initialState = { ok: false, message: '' };

export function PurchaseFiscalWorkspace({ data }: { data: FiscalWorkspace }) {
  const [receiptId, setReceiptId] = useState('');
  const selected = useMemo(
    () => data.eligiblePurchaseReceipts.find((item) => item.id === receiptId),
    [data.eligiblePurchaseReceipts, receiptId],
  );
  const [createState, createAction, createPending] = useActionState(
    createPurchaseFiscalDocumentAction, initialState,
  );
  const pending = data.purchaseDocuments.filter((item) => item.status === 'RECEIVED');
  const open = data.purchaseDocuments.filter((item) => item.payable && item.payable.outstandingAmount !== '0.00');
  const totalOpen = open.reduce((sum, item) => sum + Number(item.payable?.outstandingAmount ?? 0), 0);

  return <>
    <DemoMetricStrip items={[
      { label: 'Recebimentos aptos', value: String(data.eligiblePurchaseReceipts.length), detail: 'peso e qualidade aceitos' },
      { label: 'Em conferência', value: String(pending.length), detail: 'aguardando validação', tone: pending.length ? 'attention' : undefined },
      { label: 'Entradas validadas', value: String(data.purchaseDocuments.filter((item) => item.status === 'VALIDATED').length), detail: 'documentos vinculados', tone: 'primary' },
      { label: 'Contas a pagar', value: formatFiscalMoney(totalOpen.toFixed(2)), detail: `${open.length} título(s) com saldo`, tone: 'attention' },
    ]} />

    <DemoSection kicker="COMPRA · RECEBIMENTO → FISCAL" title="Registrar NF-e de entrada" id="nova-entrada" aside="contrato, carga, romaneio e peso preservados">
      <form action={createAction} className="fiscal-entry-form">
        <Field label="Recebimento aceito" required>
          <select name="loadReceiptId" value={receiptId} onChange={(event) => setReceiptId(event.target.value)} required>
            <option value="" disabled>Selecione</option>
            {data.eligiblePurchaseReceipts.map((receipt) => <option value={receipt.id} key={receipt.id}>
              {receipt.invoiceNumber} · {receipt.counterpartyName} · {receipt.commodity} · {Number(receipt.acceptedWeightKg).toLocaleString('pt-BR')} kg
            </option>)}
          </select>
        </Field>
        <Field label="Número da NF-e" required><input name="documentNumber" defaultValue={selected?.invoiceNumber ?? ''} key={`number-${selected?.id ?? 'empty'}`} required /></Field>
        <Field label="Chave de acesso" hint="44 dígitos; obrigatória para validar."><input name="accessKey" inputMode="numeric" pattern="[0-9]{44}" maxLength={44} defaultValue={selected?.accessKey ?? ''} key={`key-${selected?.id ?? 'empty'}`} /></Field>
        <Field label="Emissão" required><input type="datetime-local" name="issuedAt" required /></Field>
        <DecimalField name="totalAmount" label="Valor total da NF-e" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required />
        <Field label="Vencimento" required><input type="date" name="dueDate" required /></Field>
        <Field label="Número do título" required><input name="titleNumber" placeholder="CP-2026-0001" required /></Field>
        <Field label="Observações de conferência"><textarea name="validationNotes" rows={2} /></Field>
        {selected ? <p className="finance-form-hint">Base operacional: {Number(selected.acceptedWeightKg).toLocaleString('pt-BR')} kg aceitos × {formatFiscalMoney(selected.purchasePricePerSc)}/sc. O backend confere o valor exato.</p> : null}
        <div className="fiscal-entry-action"><Feedback state={createState} /><Button type="submit" disabled={createPending || !selected}>{createPending ? 'Registrando…' : 'Registrar entrada fiscal'}</Button></div>
      </form>
    </DemoSection>

    <DemoSection kicker="RASTREABILIDADE DE COMPRA" title="Entradas fiscais e contas a pagar" id="documentos" aside="dados reais do backend">
      {data.purchaseDocuments.length ? <DemoTable label="Entradas fiscais" columns={['NF-e', 'Contrato', 'Fornecedor', 'Commodity', 'Peso aceito', 'Valor informado', 'Valor esperado', 'Vencimento', 'Status', 'Saldo']} rows={data.purchaseDocuments.map((document) => [
        document.documentNumber, `v${document.contractVersionNumber}`, document.counterpartyName, document.commodity,
        `${Number(document.acceptedWeightKg).toLocaleString('pt-BR')} kg`, formatFiscalMoney(document.totalAmount),
        formatFiscalMoney(document.expectedAmount), formatFiscalDate(document.dueDate),
        <DemoStatus key={document.id} tone={document.status === 'VALIDATED' ? 'positive' : document.status === 'REJECTED' ? 'critical' : 'attention'}>{document.status === 'VALIDATED' ? 'Validada' : document.status === 'REJECTED' ? 'Rejeitada' : 'Em conferência'}</DemoStatus>,
        document.payable ? formatFiscalMoney(document.payable.outstandingAmount) : 'Título ainda não emitido',
      ])} /> : <EmptyState compact eyebrow="SEM ENTRADAS" title="Nenhuma NF-e de compra registrada" description="Receba e aceite uma carga para disponibilizar o vínculo da nota fiscal de entrada." action={{ href: '/recebimentos', label: 'Abrir recebimentos' }} />}
    </DemoSection>

    {data.purchaseDocuments.filter((item) => item.status !== 'VALIDATED').map((document) => <PurchaseDecision document={document} key={document.id} />)}
  </>;
}

function PurchaseDecision({ document }: { document: FiscalWorkspace['purchaseDocuments'][number] }) {
  const [updateState, updateAction, updatePending] = useActionState(updateFiscalDocumentAction, initialState);
  const [validateState, validateAction, validatePending] = useActionState(validateFiscalDocumentAction, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectFiscalDocumentAction, initialState);
  return <DemoSection kicker="CONFERÊNCIA" title={document.documentNumber} aside={`${document.counterpartyName} · ${document.commodity} · contrato v${document.contractVersionNumber}`}>
    <dl className="summary-ledger">
      <div><dt>NF-e</dt><dd>{formatFiscalMoney(document.totalAmount)}</dd></div>
      <div><dt>Cálculo</dt><dd>{formatFiscalMoney(document.expectedAmount)}</dd></div>
      <div><dt>Diferença</dt><dd>{formatFiscalMoney(document.differenceAmount)}</dd></div>
      <div><dt>Romaneio</dt><dd>{document.scaleTicketNumber ?? 'Sem ticket'}</dd></div>
    </dl>
    <div className="fiscal-decision-grid">
      <form action={updateAction}>
        <input type="hidden" name="documentId" value={document.id} />
        <Field label="Número da NF-e" required><input name="documentNumber" defaultValue={document.documentNumber} required /></Field>
        <Field label="Chave de acesso" required><input name="accessKey" inputMode="numeric" pattern="[0-9]{44}" maxLength={44} defaultValue={document.accessKey ?? ''} required /></Field>
        <Field label="Emissão" required><input type="datetime-local" name="issuedAt" defaultValue={toLocalInput(document.issuedAt)} required /></Field>
        <DecimalField name="totalAmount" label="Valor total" prefix="R$" defaultValue={document.totalAmount} fractionDigits={2} required />
        <Field label="Observações"><textarea name="validationNotes" rows={2} defaultValue={document.validationNotes ?? ''} /></Field>
        <Feedback state={updateState} />
        <Button type="submit" disabled={updatePending}>{updatePending ? 'Salvando…' : 'Salvar correção'}</Button>
      </form>
      <form action={validateAction}><input type="hidden" name="documentId" value={document.id} /><Feedback state={validateState} /><Button type="submit" disabled={validatePending || document.status === 'REJECTED'}>{validatePending ? 'Validando…' : 'Validar e emitir contas a pagar'}</Button></form>
      <form action={rejectAction}><input type="hidden" name="documentId" value={document.id} /><Field label="Motivo da rejeição" required><textarea name="reason" minLength={3} maxLength={500} rows={2} required /></Field><Feedback state={rejectState} /><Button type="submit" disabled={rejectPending || document.status === 'REJECTED'}>{rejectPending ? 'Rejeitando…' : 'Rejeitar documento'}</Button></form>
    </div>
  </DemoSection>;
}

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role={state.ok ? 'status' : 'alert'} aria-live={state.ok ? 'polite' : 'assertive'}>{state.message}</p> : null;
}

function toLocalInput(value: string) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}T${read('hour')}:${read('minute')}`;
}
