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
  FISCAL_ESTABLISHMENT_ALREADY_EXISTS: 'Já existe um estabelecimento com esse CNPJ neste tenant.',
  FISCAL_ESTABLISHMENT_NOT_FOUND: 'O estabelecimento selecionado não foi encontrado ou está inativo.',
  FISCAL_CONFIGURATION_NOT_FOUND: 'A configuração fiscal não foi encontrada.',
  FISCAL_CONFIGURATION_IMMUTABLE: 'Versões ativas ou encerradas não podem ser alteradas. Crie uma nova versão.',
  FISCAL_CONFIGURATION_INCOMPLETE: 'Complete todos os campos obrigatórios e ao menos um tratamento tributário antes de ativar.',
  FISCAL_CONFIGURATION_OVERLAP: 'Já existe uma configuração ativa para a mesma operação e vigência.',
  FISCAL_CONFIGURATION_DRAFT_EXISTS: 'Já existe uma nova versão em rascunho para esta configuração.',
  FISCAL_CONFIGURATION_VERSION_REQUIRES_ACTIVE: 'Ative a versão atual antes de criar sua sucessora.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para esta operação.',
};

export async function createFiscalEstablishmentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  return send('/v1/fiscal/establishments', 'POST', establishmentPayload(formData),
    'Estabelecimento fiscal cadastrado.');
}

export async function updateFiscalEstablishmentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const id = encodeURIComponent(String(formData.get('establishmentId') ?? ''));
  return send(`/v1/fiscal/establishments/${id}`, 'PATCH', establishmentPayload(formData),
    'Estabelecimento fiscal atualizado.');
}

export async function createFiscalConfigurationAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  return send('/v1/fiscal/configurations', 'POST', configurationPayload(formData),
    'Versão fiscal criada como rascunho.');
}

export async function updateFiscalConfigurationAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const id = encodeURIComponent(String(formData.get('configurationId') ?? ''));
  return send(`/v1/fiscal/configurations/${id}`, 'PATCH', configurationPayload(formData),
    'Rascunho fiscal atualizado.');
}

export async function activateFiscalConfigurationAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const id = encodeURIComponent(String(formData.get('configurationId') ?? ''));
  return send(`/v1/fiscal/configurations/${id}/activate`, 'POST', undefined,
    'Versão fiscal ativada. O motor de cálculo continua separado e entra na próxima etapa.');
}

export async function newFiscalConfigurationVersionAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const id = encodeURIComponent(String(formData.get('configurationId') ?? ''));
  return send(`/v1/fiscal/configurations/${id}/new-version`, 'POST', undefined,
    'Nova versão criada como rascunho, preservando a versão anterior.');
}

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

function establishmentPayload(formData: FormData) {
  return {
    legalName: String(formData.get('legalName') ?? ''),
    taxId: String(formData.get('taxId') ?? '').replace(/\D/g, ''),
    stateRegistration: nullable(formData.get('stateRegistration')),
    uf: String(formData.get('uf') ?? '').toUpperCase(),
    taxRegime: nullable(formData.get('taxRegime')),
  };
}

function configurationPayload(formData: FormData) {
  const taxes = ['ICMS', 'PIS', 'COFINS', 'FUNRURAL'] as const;
  return {
    establishmentId: nullable(formData.get('establishmentId')),
    name: String(formData.get('configurationName') ?? ''),
    commodity: nullable(formData.get('commodity')),
    destinationUf: nullable(formData.get('destinationUf'))?.toUpperCase() ?? null,
    cfop: nullable(formData.get('cfop')),
    emissionStrategy: nullable(formData.get('emissionStrategy')),
    technicalResponsible: nullable(formData.get('technicalResponsible')),
    effectiveFrom: nullable(formData.get('effectiveFrom')),
    effectiveTo: nullable(formData.get('effectiveTo')),
    taxComponents: taxes.flatMap((tax) => {
      const key = tax.toLowerCase();
      const treatment = nullable(formData.get(`${key}Treatment`));
      if (!treatment) return [];
      return [{
        tax,
        treatment,
        ratePct: treatment === 'TAXED' ? nullable(decimal(formData.get(`${key}RatePct`))) : null,
        retained: formData.get(`${key}Retained`) === 'on',
      }];
    }),
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

function nullable(value: FormDataEntryValue | null): string | null {
  return String(value ?? '').trim() || null;
}
