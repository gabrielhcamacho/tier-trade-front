'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';
import type { DocumentAggregateType, DocumentType } from '../../lib/documents';

export type DocumentActionState = { ok: boolean; message: string };

const allowedTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const messages: Record<string, string> = {
  DOCUMENT_AGGREGATE_NOT_FOUND: 'O registro ao qual o arquivo seria vinculado não foi encontrado.',
  DOCUMENT_UPLOAD_URL_FAILED: 'Não foi possível preparar o envio ao armazenamento privado.',
  DOCUMENT_OBJECT_NOT_FOUND: 'O arquivo não chegou ao armazenamento. Tente novamente.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para anexar documentos.',
};

export async function uploadDocumentAction(
  _state: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return fail('Selecione um arquivo para enviar.');
  if (file.size > 26_214_400) return fail('O arquivo deve ter no máximo 25 MB.');
  if (!allowedTypes.has(file.type)) return fail('Use PDF, JPEG, PNG, DOCX ou XLSX.');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || !supabaseUrl || !publishableKey || Object.keys(identityHeaders).length === 0) {
    return fail('A API, o Supabase ou a identidade do ambiente ainda não está configurada.');
  }

  const aggregateType = String(formData.get('aggregateType') ?? '') as DocumentAggregateType;
  const aggregateId = String(formData.get('aggregateId') ?? '');
  const documentType = String(formData.get('documentType') ?? '') as DocumentType;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  try {
    const request = await fetch(`${apiUrl}/v1/documents/upload-request`, {
      method: 'POST',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        aggregateType, aggregateId, documentType, fileName: file.name,
        mimeType: file.type, sizeBytes: file.size, notes,
      }),
      cache: 'no-store',
    });
    if (!request.ok) return apiFailure(request);
    const upload = await request.json() as { id: string; storagePath: string; uploadToken: string };
    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await supabase.storage.from('tier-trade-documents').uploadToSignedUrl(
      upload.storagePath,
      upload.uploadToken,
      bytes,
      { contentType: file.type, upsert: false },
    );
    if (stored.error) return fail('O envio do arquivo falhou. Tente novamente.');

    const completed = await fetch(`${apiUrl}/v1/documents/${encodeURIComponent(upload.id)}/complete`, {
      method: 'POST',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    if (!completed.ok) return apiFailure(completed);
    const returnPath = String(formData.get('returnPath') ?? '');
    if (returnPath.startsWith('/') && !returnPath.startsWith('//')) revalidatePath(returnPath);
    return { ok: true, message: 'Documento enviado, vinculado e auditado.' };
  } catch {
    return fail('Não foi possível acessar a API ou o armazenamento configurado.');
  }
}

async function apiFailure(response: Response): Promise<DocumentActionState> {
  const body = await response.json().catch(() => ({})) as { code?: string; issues?: Array<{ message: string }> };
  return fail((body.code && messages[body.code]) || body.issues?.[0]?.message || 'Não foi possível concluir a operação.');
}

function fail(message: string): DocumentActionState {
  return { ok: false, message };
}
