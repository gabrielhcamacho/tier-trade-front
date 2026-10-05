'use client';

import { Button, Field, Status } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { ContractObligation } from '../../lib/contracts';
import { obligationStatus } from '../../lib/contracts';
import { saveContractObligationAction } from './actions';

const initialState = { ok: false, message: '' };

export function ContractObligations({ contractId, obligations }: {
  contractId: string;
  obligations: ContractObligation[];
}) {
  const openCount = obligations.filter((item) => item.status === 'PENDING' || item.status === 'IN_PROGRESS').length;
  return (
    <section className="detail-section contract-obligations" aria-labelledby="contract-obligations-title">
      <header>
        <div><p className="section-kicker">EXECUÇÃO</p><h2 id="contract-obligations-title">Obrigações contratuais</h2></div>
        <span>{openCount} em aberto</span>
      </header>
      <div className="contract-obligation-list">
        {obligations.map((obligation) => (
          <ObligationEditor contractId={contractId} obligation={obligation} key={obligation.id} />
        ))}
      </div>
      <NewObligation contractId={contractId} key={obligations.length} />
    </section>
  );
}

function ObligationEditor({ contractId, obligation }: {
  contractId: string;
  obligation: ContractObligation;
}) {
  const [state, action, pending] = useActionState(saveContractObligationAction, initialState);
  const tone = obligation.status === 'COMPLETED' ? 'positive'
    : obligation.status === 'CANCELLED' ? 'neutral'
      : 'warning';
  return (
    <details className="contract-obligation-item">
      <summary>
        <div>
          <strong>{obligation.title}</strong>
          <span>
            {obligation.responsible_name ?? 'Sem responsável'}
            {' · '}
            {obligation.due_date ? `Prazo ${formatDate(obligation.due_date)}` : 'Sem prazo'}
          </span>
        </div>
        <Status tone={tone}>{obligationStatus(obligation.status)}</Status>
      </summary>
      <form action={action} className="contract-obligation-form">
        <input type="hidden" name="contractId" value={contractId} />
        <input type="hidden" name="obligationId" value={obligation.id} />
        <Field label="Obrigação" required>
          <input name="title" defaultValue={obligation.title} minLength={3} maxLength={160} required />
        </Field>
        <Field label="Responsável">
          <input name="responsibleName" defaultValue={obligation.responsible_name ?? ''} minLength={2} maxLength={120} placeholder="Pessoa ou equipe" />
        </Field>
        <Field label="Prazo"><input name="dueDate" type="date" defaultValue={obligation.due_date ?? ''} /></Field>
        <Field label="Situação">
          <select name="status" defaultValue={obligation.status}>
            <option value="PENDING">Pendente</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </Field>
        <Field label="Descrição">
          <textarea name="description" defaultValue={obligation.description ?? ''} minLength={3} maxLength={1000} rows={3} />
        </Field>
        <div className="contract-obligation-action">
          {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar obrigação'}</Button>
        </div>
      </form>
    </details>
  );
}

function NewObligation({ contractId }: { contractId: string }) {
  const [state, action, pending] = useActionState(saveContractObligationAction, initialState);
  return (
    <details className="contract-obligation-new">
      <summary>+ Nova obrigação</summary>
      <form action={action} className="contract-obligation-form">
        <input type="hidden" name="contractId" value={contractId} />
        <Field label="Obrigação" required>
          <input name="title" minLength={3} maxLength={160} placeholder="Ex.: Conferir garantia contratual" required />
        </Field>
        <Field label="Responsável"><input name="responsibleName" minLength={2} maxLength={120} placeholder="Pessoa ou equipe" /></Field>
        <Field label="Prazo"><input name="dueDate" type="date" /></Field>
        <Field label="Descrição"><textarea name="description" minLength={3} maxLength={1000} rows={3} /></Field>
        <div className="contract-obligation-action">
          {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? 'Criando…' : 'Criar obrigação'}</Button>
        </div>
      </form>
    </details>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
