'use client';

import { Button, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import { transitionContractAction, type ContractActionState } from './actions';

const initial: ContractActionState = { ok: false, message: '' };
const next: Record<string, { status: string; label: string } | undefined> = {
  DRAFT: { status: 'AWAITING_SIGNATURE', label: 'Enviar para assinatura' },
  AWAITING_SIGNATURE: { status: 'SIGNED', label: 'Confirmar assinatura' },
  SIGNED: { status: 'ACTIVE', label: 'Ativar contrato' },
  ACTIVE: { status: 'CLOSED', label: 'Encerrar contrato' },
};

export function ContractLifecycle({ contractId, status }: { contractId: string; status: string }) {
  const [state, action, pending] = useActionState(transitionContractAction, initial);
  const transition = next[status];
  if (!transition) return null;
  return <section className="detail-section contract-lifecycle" aria-labelledby="contract-lifecycle-title">
    <header><p className="section-kicker">CICLO CONTRATUAL</p><h2 id="contract-lifecycle-title">Próxima decisão</h2></header>
    {transition ? <form action={action}>
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="status" value={transition.status} />
      <Button type="submit" disabled={pending}>{pending ? 'Processando…' : transition.label}</Button>
    </form> : null}
    {!['CLOSED', 'CANCELLED'].includes(status) ? <form action={action}>
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="status" value="CANCELLED" />
      <Field label="Motivo do cancelamento"><input name="reason" minLength={3} required /></Field>
      <Button type="submit" disabled={pending} data-variant="secondary">Cancelar contrato</Button>
    </form> : null}
    {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role={state.ok ? 'status' : 'alert'} aria-live={state.ok ? 'polite' : 'assertive'}>{state.message}</p> : null}
  </section>;
}
