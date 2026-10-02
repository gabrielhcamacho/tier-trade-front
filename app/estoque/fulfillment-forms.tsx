'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState, useState } from 'react';
import type { InventoryPosition } from '../../lib/inventory';
import {
  allocateInventoryAction,
  dispatchInventoryAction,
  initialFulfillmentState,
  saveSalesContractAction,
} from './actions';

type FulfillmentData = Pick<InventoryPosition, 'salesContracts' | 'counterparties' | 'allocations' | 'lots'>;

export function FulfillmentForms({ data }: { data: FulfillmentData }) {
  const [salesState, salesAction, salesPending] = useActionState(saveSalesContractAction, initialFulfillmentState);
  const [allocationState, allocationAction, allocationPending] = useActionState(allocateInventoryAction, initialFulfillmentState);
  const [dispatchState, dispatchAction, dispatchPending] = useActionState(dispatchInventoryAction, initialFulfillmentState);
  const [editingId, setEditingId] = useState('');
  const editing = data.salesContracts.find((item) => item.id === editingId);
  const activeAllocations = data.allocations.filter((item) => item.status === 'ACTIVE');

  return (
    <div className="fulfillment-forms">
      <form action={salesAction} key={editingId || 'new'}>
        <header><div><p className="section-kicker">1 · DEMANDA DE VENDA</p><h3>Contrato de venda</h3></div></header>
        <Field label="Ação"><select value={editingId} onChange={(event) => setEditingId(event.target.value)}><option value="">Novo contrato</option>{data.salesContracts.map((item) => <option value={item.id} key={item.id}>Editar {item.reference}</option>)}</select></Field>
        <input type="hidden" name="contractId" value={editingId} />
        <Field label="Contraparte" required><select name="counterpartyId" defaultValue={editing?.counterparty_id ?? ''} required><option value="" disabled>Selecione</option>{data.counterparties.map((item) => <option value={item.id} key={item.id}>{item.legal_name}</option>)}</select></Field>
        <Field label="Referência" required><input name="reference" defaultValue={editing?.reference ?? ''} placeholder="CV-2026-0043" required /></Field>
        <DecimalField name="quantityKg" label="Volume contratado" suffix="kg" defaultValue={editing?.quantity_kg ?? '0'} fractionDigits={3} emptyWhenZero={!editing} required />
        <DecimalField name="salePricePerKg" label="Preço de venda" prefix="R$" suffix="/kg" defaultValue={editing?.sale_price_per_kg ?? '0'} fractionDigits={6} emptyWhenZero={!editing} required />
        <Field label="Destino" required><input name="destinationCode" defaultValue={editing?.destination_code ?? ''} placeholder="IND_SP_01" required /></Field>
        <Field label="Início da janela" required><input type="date" name="deliveryStart" defaultValue={editing?.delivery_start ?? ''} required /></Field>
        <Field label="Fim da janela" required><input type="date" name="deliveryEnd" defaultValue={editing?.delivery_end ?? ''} required /></Field>
        <Field label="Documentos exigidos" hint="Separe os documentos por vírgula."><input name="requiredDocuments" defaultValue={editing?.required_documents.join(', ') ?? ''} placeholder="Nota fiscal, romaneio de pesagem" /></Field>
        <Field label="Prazo financeiro" hint="Dias corridos após a expedição; deixe vazio quando ainda não definido."><input type="number" name="paymentTermDays" min={0} max={730} defaultValue={editing?.payment_term_days ?? ''} placeholder="7" /></Field>
        <Feedback state={salesState} />
        <Button type="submit" disabled={salesPending}>{salesPending ? 'Salvando…' : editing ? 'Atualizar contrato' : 'Criar contrato'}</Button>
      </form>

      <form action={allocationAction}>
        <header><div><p className="section-kicker">2 · COBERTURA</p><h3>Alocar lote</h3></div></header>
        <Field label="Contrato de venda" required><select name="salesContractId" defaultValue="" required><option value="" disabled>Selecione</option>{data.salesContracts.filter((item) => item.status === 'ACTIVE').map((item) => <option value={item.id} key={item.id}>{item.reference} · saldo {(Number(item.quantity_kg) - Number(item.allocated_kg)) / 1000} t</option>)}</select></Field>
        <Field label="Lote disponível" required><select name="lotId" defaultValue="" required><option value="" disabled>Selecione</option>{data.lots.filter((item) => Number(item.availableKg) > 0).map((item) => <option value={item.id} key={item.id}>{item.lotCode} · {(Number(item.availableKg) / 1000).toLocaleString('pt-BR')} t</option>)}</select></Field>
        <DecimalField name="quantityKg" label="Quantidade a alocar" suffix="kg" defaultValue="0" fractionDigits={3} emptyWhenZero required />
        <Feedback state={allocationState} />
        <Button type="submit" disabled={allocationPending}>{allocationPending ? 'Alocando…' : 'Alocar estoque'}</Button>
      </form>

      <form action={dispatchAction}>
        <header><div><p className="section-kicker">3 · EXPEDIÇÃO</p><h3>Registrar saída</h3></div></header>
        <Field label="Alocação" required><select name="allocationId" defaultValue="" required><option value="" disabled>Selecione</option>{activeAllocations.map((item) => <option value={item.id} key={item.id}>{item.contract_reference} · {item.lot_code} · saldo {(Number(item.quantity_kg) - Number(item.dispatched_kg)) / 1000} t</option>)}</select></Field>
        <DecimalField name="quantityKg" label="Peso líquido expedido" suffix="kg" defaultValue="0" fractionDigits={3} emptyWhenZero required />
        <Field label="Data e hora" required><input type="datetime-local" name="dispatchedAt" required /></Field>
        <Field label="Placa" required><input name="vehiclePlate" placeholder="ABC-1D23" required /></Field>
        <Field label="Documento" required><input name="documentReference" placeholder="NF-000123" required /></Field>
        <Field label="Observações"><textarea name="notes" rows={3} /></Field>
        <Feedback state={dispatchState} />
        <Button type="submit" disabled={dispatchPending || activeAllocations.length === 0}>{dispatchPending ? 'Registrando…' : 'Confirmar expedição'}</Button>
      </form>
    </div>
  );
}

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null;
}
