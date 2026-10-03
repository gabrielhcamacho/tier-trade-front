'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

export type FiscalActionState = { ok: boolean; message: string };

const messages: Record<string, string> = {
  FINANCIAL_EVENT_NOT_FOUND: 'O evento financeiro selecionado não foi encontrado.',
  FISCAL_DOCUMENT_NOT_FOUND: 'O documento fiscal não foi encontrado.',
  FISCAL_DOCUMENT_ALREADY_EXISTS: 'Já existe uma NF-e para essa expedição, numeração ou chave de acesso.',
  FISCAL_DOCUMENT_ALREADY_VALIDATED: 'Esse documento já foi validado.',
  FISCAL_ACCESS_KEY_REQUIRED: 'Informe a chave de acesso de 44 dígitos antes da validação.',
  FISCAL_FINANCIAL_EVENT_NOT_READY: 'O valor financeiro ainda depende da política de arredondamento.',
  FISCAL_DOCUMENT_VALUE_DIVERGENCE: 'O valor da NF-e diverge do evento financeiro. Corrija o documento antes de validar.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para esta operação.',
};

export async function createFiscalDocumentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  return send('/v1/fiscal/documents', 'POST', documentPayload(formData, true),
    'Documento recebido e salvo para conferência.');
}

export async function updateFiscalDocumentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const id = encodeURIComponent(String(formData.get('documentId') ?? ''));
  return send(`/v1/fiscal/documents/${id}`, 'PATCH', documentPayload(formData, false),
    'Correção salva. O documento voltou para conferência.');
}

export async function validateFiscalDocumentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const id = encodeURIComponent(String(formData.get('documentId') ?? ''));
  return send(`/v1/fiscal/documents/${id}/validate`, 'POST', undefined,
    'Documento validado e título financeiro vinculado.');
}

export async function rejectFiscalDocumentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const id = encodeURIComponent(String(formData.get('documentId') ?? ''));
  return send(`/v1/fiscal/documents/${id}/reject`, 'POST', {
    reason: String(formData.get('reason') ?? ''),
  }, 'Documento rejeitado sem apagar o histórico.');
}

function documentPayload(formData: FormData, includeEvent: boolean) {
  const local = String(formData.get('issuedAt') ?? '');
  return {
    ...(includeEvent ? { financialEventId: String(formData.get('financialEventId') ?? '') } : {}),
    documentNumber: String(formData.get('documentNumber') ?? ''),
    accessKey: String(formData.get('accessKey') ?? '').replace(/\D/g, '') || null,
    issuedAt: local ? `${local}:00-03:00` : '',
    totalAmount: decimal(formData.get('totalAmount')),
    validationNotes: String(formData.get('validationNotes') ?? '').trim() || null,
  };
}

async function send(path: string, method: 'POST' | 'PATCH', payload: unknown,
  success: string): Promise<FiscalActionState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { ok: false, message: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: { ...identityHeaders, ...(payload === undefined ? {} : { 'content-type': 'application/json' }) },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as {
        code?: string; issues?: Array<{ message: string }>;
      };
      return {
        ok: false,
        message: (body.code && messages[body.code]) || body.issues?.[0]?.message
          || 'Não foi possível concluir a operação.',
      };
    }
    revalidatePath('/fiscal');
    revalidatePath('/financeiro');
    return { ok: true, message: success };
  } catch {
    return { ok: false, message: 'Não foi possível acessar a API configurada.' };
  }
}

function decimal(value: FormDataEntryValue | null): string {
  return String(value ?? '').replace(/\./g, '').replace(',', '.');
}
