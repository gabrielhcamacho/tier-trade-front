'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { InventoryPosition } from '../../../lib/inventory';
import { amendSalesContractAction } from '../../estoque/actions';
import { initialFulfillmentState } from '../../estoque/action-state';

type Sale = InventoryPosition['salesContracts'][number];

export function SalesContractAmendment({ contract, counterparties }: {
  contract: Sale;
  counterparties: InventoryPosition['counterparties'];
}) {
  const [state, action, pending] = useActionState(amendSalesContractAction, initialFulfillmentState);
  if (contract.status !== 'ACTIVE') return null;
  return <section className="detail-section">
    <header><div><p className="section-kicker">ALTERAÇÃO CONTROLADA</p><h2>Aditivo contratual</h2></div></header>
    <p className="detail-note">As condições vigentes permanecem preservadas. O envio cria uma nova versão formal; alocações e expedições anteriores continuam ligadas à versão que utilizaram.</p>
    <form action={action} className="sales-contract-form">
      <input type="hidden" name="contractId" value={contract.id} />
      <div className="sales-contract-fields">
        <Field label="Vigência do aditivo" required><input type="date" name="effectiveOn" required /></Field>
        <Field label="Motivo do aditivo" required><textarea name="reason" minLength={3} maxLength={1000} rows={2} required /></Field>
        <Field label="Contraparte" required><select name="counterpartyId" defaultValue={contract.counterparty_id} required>
          {counterparties.map((item) => <option value={item.id} key={item.id}>{item.legal_name}</option>)}
        </select></Field>
        <Field label="Referência" required><input name="reference" defaultValue={contract.reference} required /></Field>
        <Field label="Commodity" required><select name="commodity" defaultValue={contract.commodity} required><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></Field>
        <DecimalField name="quantityKg" label="Volume contratado" suffix="kg" defaultValue={contract.quantity_kg} fractionDigits={3} required />
        <DecimalField name="salePricePerKg" label="Preço de venda" prefix="R$" suffix="/kg" defaultValue={contract.sale_price_per_kg} fractionDigits={6} required />
        <Field label="Destino" required><input name="destinationCode" defaultValue={contract.destination_code} required /></Field>
        <Field label="Início da janela" required><input type="date" name="deliveryStart" defaultValue={contract.delivery_start} required /></Field>
        <Field label="Fim da janela" required><input type="date" name="deliveryEnd" defaultValue={contract.delivery_end} required /></Field>
        <Field label="Documentos exigidos"><input name="requiredDocuments" defaultValue={contract.required_documents.join(', ')} /></Field>
        <Field label="Prazo financeiro"><input type="number" name="paymentTermDays" min={0} max={730} defaultValue={contract.payment_term_days ?? ''} /></Field>
      </div>
      {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? 'Registrando…' : 'Registrar aditivo'}</Button>
    </form>
  </section>;
}
