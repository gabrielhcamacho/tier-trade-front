'use client';

import { Button, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import { transitionSalesContractAction } from '../../estoque/actions';
import { initialFulfillmentState } from '../../estoque/action-state';

const next: Record<string, { status: string; label: string } | undefined> = {
  DRAFT: { status: 'AWAITING_SIGNATURE', label: 'Enviar para assinatura' },
  AWAITING_SIGNATURE: { status: 'SIGNED', label: 'Confirmar assinatura' },
  SIGNED: { status: 'ACTIVE', label: 'Ativar contrato de venda' },
  ACTIVE: { status: 'CLOSED', label: 'Encerrar contrato' },
};

export function SalesContractLifecycle({ contractId, status }: { contractId: string; status: string }) {
  const [state, action, pending] = useActionState(transitionSalesContractAction, initialFulfillmentState);
  const transition = next[status];
  if (!transition) return null;
  return <section className="detail-section contract-lifecycle">
    <header><p className="section-kicker">CICLO CONTRATUAL</p><h2>Próxima decisão</h2></header>
    <form action={action}>
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="status" value={transition.status} />
      <Button type="submit" disabled={pending}>{pending ? 'Processando…' : transition.label}</Button>
    </form>
    <form action={action}>
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="status" value="CANCELLED" />
      <Field label="Motivo do cancelamento"><input name="reason" minLength={3} required /></Field>
      <Button type="submit" disabled={pending} data-variant="secondary">Cancelar contrato</Button>
    </form>
    {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
  </section>;
}
