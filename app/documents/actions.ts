'use server';

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

export async function prepareDocumentUploadAction(input: {
  aggregateType: DocumentAggregateType;
  aggregateId: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
}): Promise<{ ok: true; id: string; storagePath: string; uploadToken: string } | { ok: false; message: string }> {
  if (!input.sizeBytes || input.sizeBytes > 26_214_400) return fail('O arquivo deve ter no máximo 25 MB.');
  if (!allowedTypes.has(input.mimeType)) return fail('Use PDF, JPEG, PNG, DOCX ou XLSX.');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return fail('A API ou a identidade do ambiente ainda não está configurada.');
  }
  try {
    const request = await fetch(`${apiUrl}/v1/documents/upload-request`, {
      method: 'POST',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!request.ok) return apiFailure(request);
    const upload = await request.json() as { id: string; storagePath: string; uploadToken: string };
    return { ok: true, ...upload };
  } catch {
    return fail('Não foi possível acessar a API para preparar o envio.');
  }
}

export async function completeDocumentUploadAction(documentId: string, returnPath: string): Promise<DocumentActionState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) return fail('A API ou a identidade do ambiente ainda não está configurada.');
  try {
    const completed = await fetch(`${apiUrl}/v1/documents/${encodeURIComponent(documentId)}/complete`, {
      method: 'POST',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    if (!completed.ok) return apiFailure(completed);
    if (returnPath.startsWith('/') && !returnPath.startsWith('//')) revalidatePath(returnPath);
    revalidatePath('/documentos');
    return { ok: true, message: 'Documento enviado, vinculado e auditado.' };
  } catch {
    return fail('Não foi possível confirmar o arquivo armazenado.');
  }
}

export async function recordDocumentSignatureAction(
  _state: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return fail('A API ou a identidade do ambiente ainda não está configurada.');
  }

  const documentId = String(formData.get('documentId') ?? '');
  const signerName = String(formData.get('signerName') ?? '').trim();
  const signerRole = String(formData.get('signerRole') ?? '').trim();
  const signerEmail = String(formData.get('signerEmail') ?? '').trim() || null;
  const provider = String(formData.get('provider') ?? 'MANUAL');
  const status = String(formData.get('status') ?? 'SIGNED');
  const externalEnvelopeId = String(formData.get('externalEnvelopeId') ?? '').trim() || null;
  const signedAtValue = String(formData.get('signedAt') ?? '').trim();
  if (!documentId || signerName.length < 2 || signerRole.length < 2) {
    return fail('Informe o signatário e o papel exercido no contrato.');
  }
  if (status === 'SIGNED' && !signedAtValue) return fail('Informe quando a assinatura foi concluída.');

  const parsedSignedAt = signedAtValue ? new Date(signedAtValue) : null;
  if (parsedSignedAt && Number.isNaN(parsedSignedAt.getTime())) return fail('A data da assinatura é inválida.');
  const signedAt = parsedSignedAt?.toISOString() ?? null;
  const sentAt = status === 'SENT' || status === 'SIGNED' ? signedAt ?? new Date().toISOString() : null;
  try {
    const response = await fetch(`${apiUrl}/v1/documents/${encodeURIComponent(documentId)}/signatures`, {
      method: 'POST',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        provider, externalEnvelopeId, signerName, signerEmail, signerRole, status, sentAt, signedAt,
      }),
      cache: 'no-store',
    });
    if (!response.ok) return apiFailure(response);
    const returnPath = String(formData.get('returnPath') ?? '');
    if (returnPath.startsWith('/') && !returnPath.startsWith('//')) revalidatePath(returnPath);
    return { ok: true, message: 'Evidência de assinatura registrada e auditada.' };
  } catch {
    return fail('Não foi possível acessar a API para registrar a assinatura.');
  }
}

async function apiFailure(response: Response): Promise<{ ok: false; message: string }> {
  const body = await response.json().catch(() => ({})) as { code?: string; issues?: Array<{ message: string }> };
  return fail((body.code && messages[body.code]) || body.issues?.[0]?.message || 'Não foi possível concluir a operação.');
}

function fail(message: string): { ok: false; message: string } {
  return { ok: false, message };
}
