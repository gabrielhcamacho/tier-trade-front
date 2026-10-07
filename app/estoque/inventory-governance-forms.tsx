'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState, useEffect, useState } from 'react';
import type { InventoryPosition } from '../../lib/inventory';
import { initialFulfillmentState } from './action-state';
import {
  classifyLotAction, completeTransferAction, createLocationAction,
  reconcileCountAction, recordLossAction, startTransferAction,
} from './actions';

type GovernanceData = Pick<InventoryPosition, 'lots' | 'locations' | 'counterparties' | 'transfers'>;

export function InventoryGovernanceForms({ data }: { data: GovernanceData }) {
  const [timezoneOffsetMinutes, setTimezoneOffsetMinutes] = useState(0);
  const createLocation = useActionState(createLocationAction, initialFulfillmentState);
  const classifyLot = useActionState(classifyLotAction, initialFulfillmentState);
  const startTransfer = useActionState(startTransferAction, initialFulfillmentState);
  const completeTransfer = useActionState(completeTransferAction, initialFulfillmentState);
  const recordLoss = useActionState(recordLossAction, initialFulfillmentState);
  const reconcileCount = useActionState(reconcileCountAction, initialFulfillmentState);
  useEffect(() => setTimezoneOffsetMinutes(new Date().getTimezoneOffset()), []);
  const activeTransfers = data.transfers.filter((item) => item.status === 'IN_TRANSIT');
  return (
    <div className="fulfillment-forms inventory-governance-forms">
      <OperationForm title="Localização" step="1" action={createLocation} timezoneOffsetMinutes={timezoneOffsetMinutes}>
        <Field label="Código" required><input name="code" placeholder="ARMAZEM_02" required /></Field>
        <Field label="Nome" required><input name="name" placeholder="Armazém secundário" required /></Field>
      </OperationForm>
      <OperationForm title="Titularidade e custódia" step="2" action={classifyLot} timezoneOffsetMinutes={timezoneOffsetMinutes}>
        <LotSelect lots={data.lots} />
        <Field label="Titularidade" required><select name="ownershipStatus" defaultValue="PENDING_DEFINITION"><option value="PENDING_DEFINITION">A definir</option><option value="OWN">Próprio</option><option value="THIRD_PARTY">Terceiro</option></select></Field>
        <Field label="Risco" required><select name="riskStatus" defaultValue="PENDING_DEFINITION"><option value="PENDING_DEFINITION">A definir</option><option value="ASSUMED">Assumido</option><option value="NOT_ASSUMED">Não assumido</option></select></Field>
        <Field label="Custódia" required><select name="custodyStatus" defaultValue="IN_STORAGE"><option value="IN_STORAGE">Armazenado</option><option value="RELEASED">Liberado</option></select></Field>
        <PartySelect name="ownerCounterpartyId" label="Proprietário terceiro" parties={data.counterparties} />
        <PartySelect name="custodianCounterpartyId" label="Custodiante" parties={data.counterparties} />
        <CommonEventFields />
      </OperationForm>
      <OperationForm title="Iniciar remaneio" step="3" action={startTransfer} timezoneOffsetMinutes={timezoneOffsetMinutes}>
        <LotSelect lots={data.lots.filter((lot) => lot.custodyStatus === 'IN_STORAGE')} />
        <Field label="Destino" required><select name="destinationLocationId" defaultValue="" required><option value="" disabled>Selecione</option>{data.locations.filter((item) => item.status === 'ACTIVE').map((item) => <option value={item.id} key={item.id}>{item.name} · {item.code}</option>)}</select></Field>
        <Field label="Início" required><input type="datetime-local" name="startedAt" required /></Field>
        <Reason />
      </OperationForm>
      <OperationForm title="Concluir remaneio" step="4" action={completeTransfer} timezoneOffsetMinutes={timezoneOffsetMinutes}>
        <Field label="Remaneio em trânsito" required><select name="transferId" defaultValue="" required><option value="" disabled>Selecione</option>{activeTransfers.map((item) => <option value={item.id} key={item.id}>{item.lot_code} · {item.source_location_code} → {item.destination_location_code}</option>)}</select></Field>
        <Field label="Conclusão" required><input type="datetime-local" name="completedAt" required /></Field>
        <Reason />
      </OperationForm>
      <OperationForm title="Perda operacional" step="5" action={recordLoss} timezoneOffsetMinutes={timezoneOffsetMinutes}>
        <LotSelect lots={data.lots} />
        <DecimalField name="quantityKg" label="Quantidade perdida" suffix="kg" defaultValue="0" fractionDigits={3} emptyWhenZero required />
        <CommonEventFields />
      </OperationForm>
      <OperationForm title="Inventário físico" step="6" action={reconcileCount} timezoneOffsetMinutes={timezoneOffsetMinutes}>
        <LotSelect lots={data.lots} />
        <DecimalField name="countedQuantityKg" label="Quantidade contada" suffix="kg" defaultValue="0" fractionDigits={3} required />
        <CommonEventFields />
      </OperationForm>
    </div>
  );
}

function OperationForm({ title, step, action, timezoneOffsetMinutes, children }: {
  title: string; step: string;
  action: readonly [{ ok: boolean; message: string }, (payload: FormData) => void, boolean];
  timezoneOffsetMinutes: number;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = action;
  return <form action={formAction}><input type="hidden" name="timezoneOffsetMinutes" value={timezoneOffsetMinutes} /><header><div><p className="section-kicker">{step} · CONTROLE</p><h3>{title}</h3></div></header>{children}
    {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Confirmar'}</Button></form>;
}

function LotSelect({ lots }: { lots: InventoryPosition['lots'] }) {
  return <Field label="Lote" required><select name="lotId" defaultValue="" required><option value="" disabled>Selecione</option>{lots.map((lot) => <option value={lot.id} key={lot.id}>{lot.lotCode} · {(Number(lot.quantityKg) / 1000).toLocaleString('pt-BR')} t</option>)}</select></Field>;
}

function PartySelect({ name, label, parties }: { name: string; label: string; parties: InventoryPosition['counterparties'] }) {
  return <Field label={label}><select name={name} defaultValue=""><option value="">Não definido</option>{parties.map((party) => <option value={party.id} key={party.id}>{party.legal_name}</option>)}</select></Field>;
}

function CommonEventFields() {
  return <><Field label="Data e hora" required><input type="datetime-local" name="occurredAt" required /></Field><Reason /></>;
}

function Reason() {
  return <Field label="Motivo" required><textarea name="reason" minLength={5} maxLength={1000} required /></Field>;
}
