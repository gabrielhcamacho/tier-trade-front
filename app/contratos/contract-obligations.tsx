'use client';

import { Button, Field, Status } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { ContractObligation } from '../../lib/contracts';
import { obligationStatus } from '../../lib/contracts';
import type { StoredDocument } from '../../lib/documents';
import { attachObligationEvidenceAction, saveContractObligationAction } from './actions';

const initialState = { ok: false, message: '' };

export function ContractObligations({ contractId, obligations, documents }: {
  contractId: string;
  obligations: ContractObligation[];
  documents: StoredDocument[];
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
          <ObligationEditor contractId={contractId} obligation={obligation} documents={documents} key={obligation.id} />
        ))}
      </div>
      <NewObligation contractId={contractId} key={obligations.length} />
    </section>
  );
}

function ObligationEditor({ contractId, obligation, documents }: {
  contractId: string;
  obligation: ContractObligation;
  documents: StoredDocument[];
}) {
  const [state, action, pending] = useActionState(saveContractObligationAction, initialState);
  const [evidenceState, evidenceAction, evidencePending] = useActionState(attachObligationEvidenceAction, initialState);
  const linkedIds = new Set((obligation.evidence ?? []).map((item) => item.documentId));
  const availableDocuments = documents.filter((item) => item.status === 'AVAILABLE' && !linkedIds.has(item.id));
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
      <div className="contract-obligation-form">
        <strong>Evidências vinculadas</strong>
        {(obligation.evidence ?? []).length > 0 ? <ul>
          {obligation.evidence.map((item) => <li key={item.documentId}>
            {item.status === 'AVAILABLE'
              ? <a href={`/documentos/${item.documentId}/download`}>{item.fileName}</a>
              : <span>{item.fileName}</span>}
            {item.status !== 'AVAILABLE' ? ' · indisponível para download' : ''}
          </li>)}
        </ul> : <p>Nenhum documento vinculado a esta obrigação.</p>}
        <form action={evidenceAction}>
          <input type="hidden" name="contractId" value={contractId} />
          <input type="hidden" name="obligationId" value={obligation.id} />
          <Field label="Vincular documento existente">
            <select name="documentId" defaultValue="" disabled={availableDocuments.length === 0} required>
              <option value="" disabled>Selecione um documento disponível</option>
              {availableDocuments.map((item) => <option value={item.id} key={item.id}>{item.file_name}</option>)}
            </select>
          </Field>
          {evidenceState.message ? <p className="fulfillment-feedback" data-ok={evidenceState.ok || undefined}>{evidenceState.message}</p> : null}
          <Button type="submit" disabled={evidencePending || availableDocuments.length === 0}>
            {evidencePending ? 'Vinculando…' : 'Vincular evidência'}
          </Button>
        </form>
      </div>
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
