'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { CommercialCounterparty, CommercialDemand } from '../../../lib/demands';
import { saveDemandAction, type DemandActionState } from './actions';

const initialDemandState: DemandActionState = { ok: false, message: '' };

export function DemandForm({ counterparties, demand }: {
  counterparties: CommercialCounterparty[]; demand?: CommercialDemand;
}) {
  const [state, action, pending] = useActionState(saveDemandAction, initialDemandState);
  const closed = demand?.status === 'CLOSED';
  return <form action={action} className="commercial-demand-form">
    <input type="hidden" name="id" value={demand?.id ?? ''} />
    {demand ? <input type="hidden" name="expectedVersion" value={demand.version} /> : null}
    <div className="commercial-demand-fields">
      <Field label="Contraparte" required><select name="counterpartyId" defaultValue={demand?.counterparty_id ?? ''} disabled={closed} required>
        <option value="" disabled>Selecione</option>
        {counterparties.map((item) => <option value={item.id} key={item.id} disabled={item.party_type === 'UNCLASSIFIED'}>
          {item.legal_name}{item.party_type === 'UNCLASSIFIED' ? ' · perfil pendente' : ''}
        </option>)}
      </select></Field>
      <Field label="Operação da trading" required><select name="direction" defaultValue={demand?.direction ?? 'PURCHASE'} disabled={closed} required>
        <option value="PURCHASE">Compra</option><option value="SALE">Venda</option>
      </select></Field>
      <Field label="Commodity" required><select name="commodity" defaultValue={demand?.commodity ?? 'MILHO'} disabled={closed} required>
        <option value="MILHO">Milho</option><option value="SOJA">Soja</option>
      </select></Field>
      <DecimalField name="quantitySc" label="Volume pretendido" suffix="sc de 60 kg" defaultValue={demand?.quantity_sc ?? '0'}
        fractionDigits={3} emptyWhenZero={!demand} disabled={closed} required />
      <Field label="Início da janela" required><input type="date" name="deliveryStart" defaultValue={demand?.delivery_start ?? ''} disabled={closed} required /></Field>
      <Field label="Fim da janela" required><input type="date" name="deliveryEnd" defaultValue={demand?.delivery_end ?? ''} disabled={closed} required /></Field>
      <DecimalField name="indicativePricePerSc" label="Preço indicativo" prefix="R$" suffix="/sc" defaultValue={demand?.indicative_price_per_sc ?? '0'}
        fractionDigits={2} emptyWhenZero={!demand?.indicative_price_per_sc} disabled={closed} />
      <Field label="Descrição preliminar" hint="Não substitui a oferta, o cálculo de margem ou o contrato.">
        <textarea name="description" defaultValue={demand?.description ?? ''} disabled={closed} rows={3} />
      </Field>
    </div>
    {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role={state.ok ? 'status' : 'alert'}>{state.message}
      {state.ok && state.id && !demand ? <> <a href={`/comercial/demandas/${state.id}`}>Abrir demanda</a></> : null}</p> : null}
    {!closed ? <Button type="submit" disabled={pending || counterparties.every((item) => item.party_type === 'UNCLASSIFIED')}>
      {pending ? 'Salvando…' : demand ? 'Salvar alterações' : 'Registrar demanda'}</Button> : null}
  </form>;
}
