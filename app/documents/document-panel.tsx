'use client';

import { Button, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import {
  documentTypeLabel, formatDocumentSize,
  type DocumentAggregateType, type DocumentType, type StoredDocument,
} from '../../lib/documents';
import { recordDocumentSignatureAction, uploadDocumentAction } from './actions';

const initialState = { ok: false, message: '' };

export function DocumentPanel({ aggregateType, aggregateId, documents, error, returnPath, allowedDocumentTypes, sectionId }: {
  aggregateType: DocumentAggregateType;
  aggregateId: string;
  documents: StoredDocument[];
  error?: string | null;
  returnPath: string;
  allowedDocumentTypes: DocumentType[];
  sectionId?: string;
}) {
  const [state, action, pending] = useActionState(uploadDocumentAction, initialState);
  return (
    <section className="document-panel" id={sectionId ?? `documentos-${aggregateId}`} aria-labelledby={`documents-${aggregateId}`}>
      <header>
        <div><p className="section-kicker">ARQUIVOS PRIVADOS</p><h2 id={`documents-${aggregateId}`}>Documentos e evidências</h2></div>
        <span>{documents.length} arquivo{documents.length === 1 ? '' : 's'}</span>
      </header>
      <form action={action} className="document-upload-form">
        <input type="hidden" name="aggregateType" value={aggregateType} />
        <input type="hidden" name="aggregateId" value={aggregateId} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <Field label="Tipo do documento" required>
          <select name="documentType" defaultValue={allowedDocumentTypes[0]} required>
            {allowedDocumentTypes.map((type) => <option value={type} key={type}>{documentTypeLabel(type)}</option>)}
          </select>
        </Field>
        <Field label="Arquivo" hint="PDF, imagem, DOCX ou XLSX · até 25 MB" required>
          <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" required />
        </Field>
        <Field label="Observação"><input name="notes" maxLength={1000} placeholder="Referência, origem ou contexto do arquivo" /></Field>
        <div className="document-upload-action">
          {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Anexar documento'}</Button>
        </div>
      </form>
      {error ? <p className="document-panel-error">{error}</p> : null}
      <div className="document-list">
        {documents.length ? documents.map((document) => <article key={document.id}>
          <div>
            <strong>{document.file_name}</strong>
            <span>{documentTypeLabel(document.document_type)} · v{document.version} · {formatDocumentSize(document.size_bytes)}</span>
            {document.notes ? <small>{document.notes}</small> : null}
            {document.signatures.length ? <ul className="document-signatures" aria-label="Assinaturas registradas">
              {document.signatures.map((signature) => <li key={signature.id}>
                <strong>{signature.signerName}</strong>
                <span>{signature.signerRole} · {signatureStatusLabel(signature.status)} · {signatureProviderLabel(signature.provider)}</span>
                {signature.signedAt ? <time dateTime={signature.signedAt}>{formatSignatureDate(signature.signedAt)}</time> : null}
              </li>)}
            </ul> : null}
            {(aggregateType === 'CONTRACT' || aggregateType === 'SALES_CONTRACT')
              && document.document_type === 'SIGNED_CONTRACT' && document.status === 'AVAILABLE'
              ? <SignatureRecorder documentId={document.id} returnPath={returnPath} /> : null}
          </div>
          <div className="document-list-meta">
            <span>{document.status === 'AVAILABLE' ? 'Disponível' : 'Envio pendente'}</span>
            {document.status === 'AVAILABLE'
              ? <a href={`/documentos/${document.id}/download`}>Baixar</a>
              : null}
          </div>
        </article>) : <p>Nenhum arquivo vinculado a este registro.</p>}
      </div>
    </section>
  );
}

function SignatureRecorder({ documentId, returnPath }: { documentId: string; returnPath: string }) {
  const [state, action, pending] = useActionState(recordDocumentSignatureAction, initialState);
  return <details className="signature-recorder">
    <summary>Registrar evidência de assinatura</summary>
    <form action={action}>
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <Field label="Signatário" required><input name="signerName" minLength={2} maxLength={160} required /></Field>
      <Field label="Papel no contrato" required><input name="signerRole" minLength={2} maxLength={80} placeholder="Ex.: representante da compradora" required /></Field>
      <Field label="E-mail"><input name="signerEmail" type="email" /></Field>
      <Field label="Origem da evidência" required><select name="provider" defaultValue="MANUAL"><option value="MANUAL">Registro manual</option><option value="DOCUSIGN">DocuSign</option><option value="OTHER">Outro provedor</option></select></Field>
      <Field label="Situação" required><select name="status" defaultValue="SIGNED"><option value="SIGNED">Assinada</option><option value="SENT">Enviada para assinatura</option><option value="PENDING">Pendente</option><option value="DECLINED">Recusada</option><option value="CANCELLED">Cancelada</option></select></Field>
      <Field label="Data e hora da assinatura" hint="Obrigatória quando a situação for Assinada"><input name="signedAt" type="datetime-local" /></Field>
      <Field label="Envelope ou referência"><input name="externalEnvelopeId" maxLength={240} placeholder="Identificador externo opcional" /></Field>
      <div className="signature-recorder-action">{state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}<Button type="submit" disabled={pending}>{pending ? 'Registrando…' : 'Registrar evidência'}</Button></div>
    </form>
    <p>Este registro documenta a evidência informada; não assina o arquivo nem substitui a validação jurídica.</p>
  </details>;
}

function signatureStatusLabel(value: StoredDocument['signatures'][number]['status']) {
  return ({ PENDING: 'Pendente', SENT: 'Enviada', SIGNED: 'Assinada', DECLINED: 'Recusada', CANCELLED: 'Cancelada' })[value];
}

function signatureProviderLabel(value: StoredDocument['signatures'][number]['provider']) {
  return ({ MANUAL: 'registro manual', DOCUSIGN: 'DocuSign', OTHER: 'outro provedor' })[value];
}

function formatSignatureDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
