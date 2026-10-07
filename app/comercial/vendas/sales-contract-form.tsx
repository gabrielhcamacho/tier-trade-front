'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState, useState } from 'react';
import type { InventoryPosition } from '../../../lib/inventory';
import { initialFulfillmentState, saveSalesContractAction } from '../../estoque/actions';

type Sale = InventoryPosition['salesContracts'][number];

export function SalesContractForm({ contracts, counterparties }: {
  contracts: Sale[];
  counterparties: InventoryPosition['counterparties'];
}) {
  const [state, action, pending] = useActionState(saveSalesContractAction, initialFulfillmentState);
  const [editingId, setEditingId] = useState('');
  const editing = contracts.find((item) => item.id === editingId);
  return <form action={action} className="sales-contract-form" key={editingId || 'new'}>
    <div><p className="section-kicker">CONDIÇÕES COMERCIAIS</p><h2>{editing ? `Editar ${editing.reference}` : 'Formalizar venda'}</h2>
      <p>O contrato nasce ativo no fluxo atual. O registro e cada revisão ficam auditados; alocação e expedição são feitas em Estoque.</p></div>
    <div className="sales-contract-fields">
      <Field label="Ação"><select value={editingId} onChange={(event) => setEditingId(event.target.value)}>
        <option value="">Novo contrato</option>{contracts.map((item) => <option value={item.id} key={item.id}>Editar {item.reference}</option>)}
      </select></Field>
      <input type="hidden" name="contractId" value={editingId} />
      <Field label="Contraparte" required><select name="counterpartyId" defaultValue={editing?.counterparty_id ?? ''} required>
        <option value="" disabled>Selecione</option>{counterparties.map((item) => <option value={item.id} key={item.id}>{item.legal_name}</option>)}
      </select></Field>
      <Field label="Referência" required><input name="reference" defaultValue={editing?.reference ?? ''} placeholder="CV-2026-0043" required /></Field>
      <Field label="Commodity" required><select name="commodity" defaultValue={editing?.commodity ?? 'MILHO'} required><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></Field>
      <DecimalField name="quantityKg" label="Volume contratado" suffix="kg" defaultValue={editing?.quantity_kg ?? '0'} fractionDigits={3} emptyWhenZero={!editing} required />
      <DecimalField name="salePricePerKg" label="Preço de venda" prefix="R$" suffix="/kg" defaultValue={editing?.sale_price_per_kg ?? '0'} fractionDigits={6} emptyWhenZero={!editing} required />
      <Field label="Destino" required><input name="destinationCode" defaultValue={editing?.destination_code ?? ''} placeholder="IND_SP_01" required /></Field>
      <Field label="Início da janela" required><input type="date" name="deliveryStart" defaultValue={editing?.delivery_start ?? ''} required /></Field>
      <Field label="Fim da janela" required><input type="date" name="deliveryEnd" defaultValue={editing?.delivery_end ?? ''} required /></Field>
      <Field label="Documentos exigidos" hint="Separe por vírgula."><input name="requiredDocuments" defaultValue={editing?.required_documents.join(', ') ?? ''} placeholder="Nota fiscal, romaneio" /></Field>
      <Field label="Prazo financeiro" hint="Dias corridos após expedição; vazio se indefinido."><input type="number" name="paymentTermDays" min={0} max={730} defaultValue={editing?.payment_term_days ?? ''} placeholder="7" /></Field>
    </div>
    {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : editing ? 'Atualizar contrato' : 'Criar contrato'}</Button>
  </form>;
}
