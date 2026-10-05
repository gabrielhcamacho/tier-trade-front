'use server';

import { randomUUID } from 'node:crypto';
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
  ACCEPTED_CURRENT_RECEIPT_REQUIRED: 'Selecione um recebimento atual, aceito e com peso aprovado.',
  ROUNDING_POLICY_REQUIRED: 'O valor calculado possui fração de centavo e exige política de arredondamento.',
  PURCHASE_PAYABLE_ALREADY_EXISTS: 'Já existe um contas a pagar para esse recebimento ou essa numeração.',
  PURCHASE_DOCUMENT_CORRECTION_REQUIRES_REJECTION: 'Rejeite a entrada fiscal antes de substituí-la por um novo documento.',
  VALIDATED_FISCAL_DOCUMENT_IMMUTABLE: 'Um documento validado não pode ser rejeitado ou alterado.',
  FISCAL_ESTABLISHMENT_ALREADY_EXISTS: 'Já existe um estabelecimento com esse CNPJ neste tenant.',
  FISCAL_ESTABLISHMENT_NOT_FOUND: 'O estabelecimento selecionado não foi encontrado ou está inativo.',
  FISCAL_CONFIGURATION_NOT_FOUND: 'A configuração fiscal não foi encontrada.',
  FISCAL_CONFIGURATION_IMMUTABLE: 'Versões ativas ou encerradas não podem ser alteradas. Crie uma nova versão.',
  FISCAL_CONFIGURATION_INCOMPLETE: 'Complete todos os campos obrigatórios e ao menos um tratamento tributário antes de ativar.',
  FISCAL_CONFIGURATION_OVERLAP: 'Já existe uma configuração ativa para a mesma operação e vigência.',
  FISCAL_CONFIGURATION_DRAFT_EXISTS: 'Já existe uma nova versão em rascunho para esta configuração.',
  FISCAL_CONFIGURATION_VERSION_REQUIRES_ACTIVE: 'Ative a versão atual antes de criar sua sucessora.',
  FISCAL_CONFIGURATION_NOT_APPLICABLE: 'Nenhuma configuração ativa atende exatamente esse contexto e essa data.',
  FISCAL_CONFIGURATION_AMBIGUOUS: 'Mais de uma configuração ativa atende ao cálculo. Revise as vigências.',
  FISCAL_CONFIGURATION_INVALID: 'A configuração ativa está incompleta para cálculo.',
  FISCAL_CALCULATION_IDEMPOTENCY_CONFLICT: 'Esta solicitação já foi usada com dados diferentes.',
  FISCAL_CALCULATION_SOURCE_NOT_READY: 'A origem financeira selecionada ainda não possui valor pronto para cálculo.',
  FISCAL_CALCULATION_SOURCE_AMOUNT_MISMATCH: 'O valor bruto precisa ser exatamente o valor da origem financeira selecionada.',
  FISCAL_AUTHORITY_ALREADY_EXISTS: 'Já existe uma autoridade fiscal igual neste tenant.',
  FISCAL_AUTHORITY_NOT_FOUND: 'A autoridade fiscal selecionada não foi encontrada ou está inativa.',
  FISCAL_CALCULATION_NOT_FOUND: 'O cálculo fiscal não foi encontrado.',
  FISCAL_CALCULATION_ALREADY_ACCEPTED: 'Este cálculo já foi aceito com outra solicitação.',
  FISCAL_OBLIGATION_COMPONENTS_MISMATCH: 'Informe exatamente uma obrigação para cada tributo calculado com valor positivo.',
  FISCAL_CALCULATION_MEMORY_INVALID: 'A memória deste cálculo não pode ser aceita. Recalcule ou solicite suporte.',
  FISCAL_TITLE_REDUCTION_REQUIRES_RETENTION: 'Somente um componente marcado como retido pode reduzir o título de origem.',
  FISCAL_RETENTION_EXCEEDS_SOURCE_TITLE: 'A retenção supera o saldo disponível do título de origem.',
  FISCAL_PAYABLE_TITLE_ALREADY_EXISTS: 'Já existe um título com esse número no financeiro.',
  FISCAL_SOURCE_TITLE_REQUIRED: 'Para reduzir o título de origem, calcule usando um evento financeiro que já possua título.',
  FISCAL_RETENTION_EXCEEDS_GROSS: 'As retenções não podem superar o valor bruto.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para esta operação.',
};

export async function createFiscalEstablishmentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  return send('/v1/fiscal/establishments', 'POST', establishmentPayload(formData),
    'Estabelecimento fiscal cadastrado.');
}

export async function createFiscalAuthorityAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  return send('/v1/fiscal/authorities', 'POST', {
    legalName: String(formData.get('authorityName') ?? ''),
    taxId: nullable(formData.get('authorityTaxId')),
    jurisdiction: String(formData.get('authorityJurisdiction') ?? ''),
    uf: nullable(formData.get('authorityUf'))?.toUpperCase() ?? null,
  }, 'Autoridade fiscal cadastrada.');
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
    'Versão fiscal ativada e disponível para cálculos compatíveis.');
}

export async function createFiscalCalculationAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const sourceId = nullable(formData.get('calculationSourceId'));
  return send('/v1/fiscal/calculations', 'POST', {
    requestKey: randomUUID(),
    establishmentId: String(formData.get('calculationEstablishmentId') ?? ''),
    operationType: 'SALE_DISPATCH',
    commodity: String(formData.get('calculationCommodity') ?? '').trim().toUpperCase(),
    destinationUf: String(formData.get('calculationDestinationUf') ?? '').trim().toUpperCase(),
    occurredOn: String(formData.get('calculationOccurredOn') ?? ''),
    grossAmount: decimal(formData.get('calculationGrossAmount')),
    currency: 'BRL', sourceType: sourceId ? 'FINANCIAL_EVENT' : 'MANUAL', sourceId,
  }, 'Cálculo concluído e memória persistida.');
}

export async function acceptFiscalCalculationAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const calculationId = encodeURIComponent(String(formData.get('calculationId') ?? ''));
  const taxes = String(formData.get('obligationTaxes') ?? '').split(',').filter(Boolean);
  return send(`/v1/fiscal/calculations/${calculationId}/accept`, 'POST', {
    requestKey: randomUUID(),
    obligations: taxes.map((tax) => ({
      tax,
      authorityId: String(formData.get(`${tax}AuthorityId`) ?? ''),
      competenceDate: String(formData.get(`${tax}CompetenceDate`) ?? ''),
      dueDate: String(formData.get(`${tax}DueDate`) ?? ''),
      titleEffect: String(formData.get(`${tax}TitleEffect`) ?? ''),
      paymentResponsibility: String(formData.get(`${tax}PaymentResponsibility`) ?? ''),
      titleNumber: nullable(formData.get(`${tax}TitleNumber`)),
      documentReference: nullable(formData.get(`${tax}DocumentReference`)),
    })),
  }, 'Cálculo aceito; obrigações e efeitos financeiros foram gerados.');
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

export async function createPurchaseFiscalDocumentAction(
  _state: FiscalActionState, formData: FormData,
): Promise<FiscalActionState> {
  const local = String(formData.get('issuedAt') ?? '');
  return send('/v1/fiscal/purchase-documents', 'POST', {
    loadReceiptId: String(formData.get('loadReceiptId') ?? ''),
    documentNumber: String(formData.get('documentNumber') ?? ''),
    accessKey: String(formData.get('accessKey') ?? '').replace(/\D/g, '') || null,
    issuedAt: local ? `${local}:00-03:00` : '',
    totalAmount: decimal(formData.get('totalAmount')),
    dueDate: String(formData.get('dueDate') ?? ''),
    titleNumber: String(formData.get('titleNumber') ?? ''),
    validationNotes: String(formData.get('validationNotes') ?? '').trim() || null,
  }, 'NF-e de compra registrada. Valide para emitir o contas a pagar.');
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
    roundingMode: nullable(formData.get('roundingMode')),
    roundingScale: nullableNumber(formData.get('roundingScale')),
    taxComponents: taxes.flatMap((tax) => {
      const key = tax.toLowerCase();
      const treatment = nullable(formData.get(`${key}Treatment`));
      if (!treatment) return [];
      return [{
        tax,
        treatment,
        basis: nullable(formData.get(`${key}Basis`)),
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
    revalidatePath('/fiscal/entradas');
    revalidatePath('/financeiro');
    revalidatePath('/central');
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

function nullableNumber(value: FormDataEntryValue | null): number | null {
  const normalized = String(value ?? '').trim();
  return normalized === '' ? null : Number(normalized);
}
