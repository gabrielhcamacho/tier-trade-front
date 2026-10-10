'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { InventoryPosition } from '../../lib/inventory';
import { initialFulfillmentState } from './action-state';
import {
  allocateInventoryAction,
  createDeliveryRequirementPolicyAction,
  dispatchInventoryAction,
  recordDestinationReceiptAction,
  updateDeliveryRequirementAction,
} from './actions';

type FulfillmentData = Pick<InventoryPosition,
  'salesContracts' | 'allocations' | 'lots' | 'dispatches' | 'counterparties'
  | 'deliveryRequirementPolicies' | 'deliveryRequirements'>;

export function FulfillmentForms({ data }: { data: FulfillmentData }) {
  const [allocationState, allocationAction, allocationPending] = useActionState(allocateInventoryAction, initialFulfillmentState);
  const [dispatchState, dispatchAction, dispatchPending] = useActionState(dispatchInventoryAction, initialFulfillmentState);
  const [destinationState, destinationAction, destinationPending] = useActionState(recordDestinationReceiptAction, initialFulfillmentState);
  const [policyState, policyAction, policyPending] = useActionState(createDeliveryRequirementPolicyAction, initialFulfillmentState);
  const [requirementState, requirementAction, requirementPending] = useActionState(updateDeliveryRequirementAction, initialFulfillmentState);
  const activeAllocations = data.allocations.filter((item) => item.status === 'ACTIVE');

  return (
    <div className="fulfillment-forms">
      <form action={allocationAction}>
        <header><div><p className="section-kicker">1 · COBERTURA</p><h3>Alocar lote</h3></div></header>
        <Field label="Contrato de venda" required><select name="salesContractId" defaultValue="" required><option value="" disabled>Selecione</option>{data.salesContracts.filter((item) => item.status === 'ACTIVE').map((item) => <option value={item.id} key={item.id}>{item.reference} · saldo {(Number(item.quantity_kg) - Number(item.allocated_kg)) / 1000} t</option>)}</select></Field>
        <Field label="Lote disponível" required><select name="lotId" defaultValue="" required><option value="" disabled>Selecione</option>{data.lots.filter((item) => Number(item.availableKg) > 0).map((item) => <option value={item.id} key={item.id}>{item.lotCode} · {(Number(item.availableKg) / 1000).toLocaleString('pt-BR')} t</option>)}</select></Field>
        <DecimalField name="quantityKg" label="Quantidade a alocar" suffix="kg" defaultValue="0" fractionDigits={3} emptyWhenZero required />
        <Feedback state={allocationState} />
        <Button type="submit" disabled={allocationPending}>{allocationPending ? 'Alocando…' : 'Alocar estoque'}</Button>
      </form>

      <form action={dispatchAction}>
        <header><div><p className="section-kicker">2 · EXPEDIÇÃO</p><h3>Registrar saída</h3></div></header>
        <Field label="Alocação" required><select name="allocationId" defaultValue="" required><option value="" disabled>Selecione</option>{activeAllocations.map((item) => <option value={item.id} key={item.id}>{item.contract_reference} · {item.lot_code} · saldo {(Number(item.quantity_kg) - Number(item.dispatched_kg)) / 1000} t</option>)}</select></Field>
        <DecimalField name="quantityKg" label="Peso líquido expedido" suffix="kg" defaultValue="0" fractionDigits={3} emptyWhenZero required />
        <Field label="Data e hora" required><input type="datetime-local" name="dispatchedAt" required /></Field>
        <Field label="Placa" required><input name="vehiclePlate" placeholder="ABC-1D23" required /></Field>
        <Field label="Documento" required><input name="documentReference" placeholder="NF-000123" required /></Field>
        <Field label="Observações"><textarea name="notes" rows={3} /></Field>
        <Feedback state={dispatchState} />
        <Button type="submit" disabled={dispatchPending || activeAllocations.length === 0}>{dispatchPending ? 'Registrando…' : 'Confirmar expedição'}</Button>
      </form>

      <form action={destinationAction}>
        <header><div><p className="section-kicker">3 · DESTINO</p><h3>Registrar descarga</h3></div></header>
        <Field label="Expedição" required><select name="dispatchId" defaultValue="" required><option value="" disabled>Selecione</option>{data.dispatches.map((item) => <option value={item.id} key={item.id}>{item.contract_reference} · {item.lot_code} · {Number(item.quantity_kg) / 1000} t{item.destination_receipt_version ? ` · corrigir v${item.destination_receipt_version}` : ''}</option>)}</select></Field>
        <DecimalField name="destinationWeightKg" label="Peso aceito no destino" suffix="kg" defaultValue="0" fractionDigits={3} emptyWhenZero required />
        <Field label="Data e hora da descarga" required><input type="datetime-local" name="unloadedAt" required /></Field>
        <Field label="Terminal / unidade" required><input name="terminalCode" placeholder="IND_PR_01" required /></Field>
        <Field label="Ticket de pesagem" required><input name="ticketReference" placeholder="TICKET-000123" required /></Field>
        <Field label="Documento do destino"><input name="destinationDocumentReference" placeholder="Romaneio ou NF" /></Field>
        <Field label="Motivo do registro ou correção" required><textarea name="reason" rows={2} minLength={5} required /></Field>
        <Field label="Observações"><textarea name="notes" rows={2} /></Field>
        <p className="form-support">O sistema calcula apenas a diferença física. Tolerância, desconto e efeito financeiro permanecem pendentes até a política ser aprovada.</p>
        <Feedback state={destinationState} />
        <Button type="submit" disabled={destinationPending || data.dispatches.length === 0}>{destinationPending ? 'Registrando…' : 'Confirmar peso do destino'}</Button>
      </form>

      <form action={policyAction}>
        <header><div><p className="section-kicker">4 · REGRA DO SACADO</p><h3>Configurar exigência</h3></div></header>
        <Field label="Sacado" required><select name="counterpartyId" defaultValue="" required><option value="" disabled>Selecione</option>{data.counterparties.map((item) => <option value={item.id} key={item.id}>{item.legal_name}</option>)}</select></Field>
        <Field label="Terminal / unidade" required><input name="terminalCode" placeholder="IND_PR_01" required /></Field>
        <Field label="Exigência" required><select name="requirementType" defaultValue="PORTAL_CONFIRMATION" required><option value="PORTAL_CONFIRMATION">Confirmação em portal</option><option value="DESTINATION_TICKET">Ticket do destino</option></select></Field>
        <Field label="Título" required><input name="title" placeholder="Enviar ticket no portal" minLength={3} required /></Field>
        <Field label="Responsável" required><input name="responsibleName" placeholder="Mesa logística" minLength={2} required /></Field>
        <Field label="Prazo após expedição (horas)" required><input name="dueHoursAfterDispatch" type="number" min={0} max={720} defaultValue={24} required /></Field>
        <Field label="Portal"><input name="portalName" placeholder="Nome do portal" /></Field>
        <Field label="Endereço do portal"><input name="portalUrl" type="url" placeholder="https://..." /></Field>
        <Field label="Consequência configurada" required><select name="consequence" defaultValue="INFORMATIONAL" required><option value="INFORMATIONAL">Somente informativa</option><option value="BLOCK_OPERATIONAL_CLOSURE">Bloqueio de fechamento</option><option value="BLOCK_ANTICIPATION">Bloqueio de antecipação</option></select></Field>
        <p className="form-support">A consequência fica registrada e visível, mas não é aplicada automaticamente antes da aprovação de V04.</p>
        <Feedback state={policyState} />
        <Button type="submit" disabled={policyPending}>{policyPending ? 'Salvando…' : 'Criar nova versão da regra'}</Button>
      </form>

      <form action={requirementAction}>
        <header><div><p className="section-kicker">5 · PENDÊNCIA</p><h3>Registrar envio e aceite</h3></div></header>
        <Field label="Pendência da expedição" required><select name="requirementId" defaultValue="" required><option value="" disabled>Selecione</option>{data.deliveryRequirements.map((item) => <option value={item.id} key={item.id}>{item.contract_reference} · {item.title} · {item.status}</option>)}</select></Field>
        <Field label="Situação" required><select name="status" defaultValue="SUBMITTED" required><option value="PENDING">Pendente</option><option value="SUBMITTED">Enviado</option><option value="ACCEPTED">Aceito</option><option value="REJECTED">Rejeitado</option><option value="WAIVED">Dispensado</option></select></Field>
        <Field label="Evidência"><input name="evidenceReference" placeholder="Ticket, arquivo ou protocolo" /></Field>
        <Field label="Confirmação do portal"><input name="portalConfirmation" placeholder="Protocolo do sacado" /></Field>
        <Field label="Motivo da atualização" required><textarea name="reason" rows={2} minLength={5} required /></Field>
        <Field label="Observações"><textarea name="notes" rows={2} /></Field>
        <Feedback state={requirementState} />
        <Button type="submit" disabled={requirementPending || data.deliveryRequirements.length === 0}>{requirementPending ? 'Atualizando…' : 'Atualizar pendência'}</Button>
      </form>
    </div>
  );
}

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role={state.ok ? 'status' : 'alert'} aria-live={state.ok ? 'polite' : 'assertive'}>{state.message}</p> : null;
}
