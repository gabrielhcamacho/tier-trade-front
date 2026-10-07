'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { InventoryPosition } from '../../lib/inventory';
import { initialFulfillmentState } from './action-state';
import {
  allocateInventoryAction,
  dispatchInventoryAction,
} from './actions';

type FulfillmentData = Pick<InventoryPosition, 'salesContracts' | 'allocations' | 'lots'>;

export function FulfillmentForms({ data }: { data: FulfillmentData }) {
  const [allocationState, allocationAction, allocationPending] = useActionState(allocateInventoryAction, initialFulfillmentState);
  const [dispatchState, dispatchAction, dispatchPending] = useActionState(dispatchInventoryAction, initialFulfillmentState);
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
    </div>
  );
}

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null;
}
