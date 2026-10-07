'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import { addNegotiationAction, closeDemandAction, type DemandActionState } from './actions';

const initialDemandState: DemandActionState = { ok: false, message: '' };

export function NegotiationForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(addNegotiationAction, initialDemandState);
  return <form action={action} className="commercial-demand-form">
    <input type="hidden" name="id" value={id} />
    <Field label="Registro da conversa" required><textarea name="note" minLength={3} rows={3} required placeholder="Condição discutida, contraproposta ou próximo passo" /></Field>
    <DecimalField name="indicativePricePerSc" label="Preço indicativo nesta interação" prefix="R$" suffix="/sc"
      defaultValue="0" fractionDigits={2} emptyWhenZero />
    <p>Notas são imutáveis e não alteram preços oficiais, margens ou contratos.</p>
    {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role={state.ok ? 'status' : 'alert'}>{state.message}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? 'Registrando…' : 'Registrar interação'}</Button>
  </form>;
}

export function CloseDemandForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(closeDemandAction, initialDemandState);
  return <form action={action} className="commercial-demand-close">
    <input type="hidden" name="id" value={id} />
    <Field label="Motivo do encerramento" required><input name="reason" minLength={3} maxLength={500} required
      placeholder="Ex.: negociação não evoluiu" /></Field>
    {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role={state.ok ? 'status' : 'alert'}>{state.message}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? 'Encerrando…' : 'Encerrar demanda'}</Button>
  </form>;
}
