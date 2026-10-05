'use client';

import { Button, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import {
  documentTypeLabel, formatDocumentSize,
  type DocumentAggregateType, type DocumentType, type StoredDocument,
} from '../../lib/documents';
import { uploadDocumentAction } from './actions';

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
