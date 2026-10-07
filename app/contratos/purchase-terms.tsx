'use client';

import { Button, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type { PurchaseContractTerms } from '../../lib/contracts';
import { createPurchaseAmendmentAction, savePurchaseTermsAction } from './actions';

export function PurchaseTerms({ contractId, terms, status }: {
  contractId: string;
  terms: PurchaseContractTerms | null;
  status: string;
}) {
  const isAmendment = status === 'ACTIVE' && Boolean(terms);
  const [state, action, pending] = useActionState(
    isAmendment ? createPurchaseAmendmentAction : savePurchaseTermsAction,
    { ok: false, message: '' },
  );
  return (
    <section className="detail-section" id="termos-compra" aria-labelledby="purchase-terms-title">
      <header>
        <div><p className="section-kicker">INSTRUMENTO DE COMPRA</p><h2 id="purchase-terms-title">Formalização</h2></div>
        <span>{terms ? `Versão ${terms.version}` : 'Pendente'}</span>
      </header>
      <p className="detail-note">{isAmendment
        ? 'O contrato está ativo. Toda alteração abaixo será registrada como aditivo formal, com vigência, motivo e nova versão imutável.'
        : 'Registre as condições do documento assinado. Preço, volume e janela de entrega permanecem vinculados à oferta aprovada. Este cadastro não executa descontos ou pagamentos automaticamente.'}</p>
      <form action={action} className="purchase-terms-form">
        <input type="hidden" name="contractId" value={contractId} />
        <input type="hidden" name="expectedVersion" value={terms?.version ?? 0} />
        {isAmendment ? <>
          <Field label="Vigência do aditivo" required><input name="effectiveOn" type="date" required /></Field>
          <Field label="Motivo do aditivo" required><textarea name="reason" minLength={3} maxLength={1000} rows={2} required /></Field>
        </> : null}
        <Field label="Número externo do contrato" required><input name="externalNumber" defaultValue={terms?.externalNumber ?? ''} maxLength={80} required /></Field>
        <Field label="Safra" required><input name="cropYear" defaultValue={terms?.cropYear ?? ''} maxLength={30} required placeholder="Ex.: 2025/26" /></Field>
        <Field label="Data da assinatura"><input name="signedOn" type="date" defaultValue={terms?.signedOn ?? ''} /></Field>
        <Field label="Local de retirada"><input name="pickupLocation" defaultValue={terms?.pickupLocation ?? ''} maxLength={240} /></Field>
        <Field label="Condição de entrega"><input name="deliveryCondition" defaultValue={terms?.deliveryCondition ?? ''} maxLength={160} placeholder="Ex.: sobre rodas" /></Field>
        <Field label="Responsável pelo frete"><select name="freightPayer" defaultValue={terms?.freightPayer ?? ''}>
          <option value="">Não informado</option><option value="BUYER">Comprador</option>
          <option value="SELLER">Vendedor</option><option value="THIRD_PARTY">Terceiro</option>
        </select></Field>
        <Field label="Responsável pela pesagem"><input name="weighingResponsibility" defaultValue={terms?.weighingResponsibility ?? ''} maxLength={240} /></Field>
        <Field label="Condições de qualidade"><textarea name="qualityTerms" defaultValue={terms?.qualityTerms ?? ''} maxLength={2000} rows={3} /></Field>
        <Field label="Documentos exigidos"><textarea name="requiredDocuments" defaultValue={terms?.requiredDocuments ?? ''} maxLength={2000} rows={3} /></Field>
        <Field label="Condições de pagamento"><textarea name="paymentTerms" defaultValue={terms?.paymentTerms ?? ''} maxLength={2000} rows={3} /></Field>
        <div className="purchase-terms-action">
          {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role="status">{state.message}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : isAmendment ? 'Registrar aditivo' : 'Salvar formalização'}</Button>
        </div>
      </form>
    </section>
  );
}
