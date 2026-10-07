'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

export type ContractActionState = { ok: boolean; message: string };

const messages: Record<string, string> = {
  CONTRACT_NOT_FOUND: 'O contrato não foi encontrado.',
  CONTRACT_NOT_ACTIVE: 'Somente contratos ativos aceitam novas obrigações.',
  CONTRACT_OBLIGATION_NOT_FOUND: 'A obrigação não existe ou não pertence a este contrato.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para alterar obrigações contratuais.',
  PURCHASE_TERMS_VERSION_CONFLICT: 'Este contrato foi alterado por outra pessoa. Atualize a página antes de salvar.',
  CONTRACT_EVIDENCE_NOT_AVAILABLE: 'Escolha um documento disponível e pertencente a este contrato.',
  PURCHASE_TERMS_REQUIRED: 'Preencha os termos do contrato antes de enviá-lo para assinatura.',
  SIGNED_CONTRACT_EVIDENCE_REQUIRED: 'Anexe o contrato assinado e registre ao menos uma assinatura concluída.',
  OPEN_LOADS_PREVENT_CONTRACT_CLOSURE: 'Conclua ou cancele as cargas abertas antes de encerrar o contrato.',
  EXECUTED_LOADS_PREVENT_CONTRACT_CANCELLATION: 'Um contrato com recebimento iniciado não pode ser cancelado.',
  INVALID_CONTRACT_STATUS_TRANSITION: 'Esta mudança de situação não é permitida.',
  ACTIVE_CONTRACT_REQUIRES_AMENDMENT: 'Contratos ativos só podem ser alterados por aditivo formal.',
  ONLY_ACTIVE_CONTRACTS_ACCEPT_AMENDMENTS: 'O aditivo só pode ser registrado em contrato ativo.',
};

export async function transitionContractAction(
  _state: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const contractId = String(formData.get('contractId') ?? '');
  const status = String(formData.get('status') ?? '');
  const reason = nullable(formData.get('reason'));
  if (!/^[0-9a-f-]{36}$/i.test(contractId) || !status) return fail('A transição informada é inválida.');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) return fail('API ou identidade não configurada.');
  try {
    const response = await fetch(`${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/transition`, {
      method: 'POST', headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason }), cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: string; issues?: Array<{ message: string }> };
      return fail((body.code && messages[body.code]) || body.issues?.[0]?.message || 'Não foi possível alterar a situação.');
    }
    revalidatePath(`/contratos/${contractId}`);
    revalidatePath('/contratos');
    revalidatePath('/cargas');
    return { ok: true, message: 'Situação contratual atualizada e versionada.' };
  } catch {
    return fail('Não foi possível acessar a API configurada.');
  }
}

export async function attachObligationEvidenceAction(
  _state: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const contractId = String(formData.get('contractId') ?? '');
  const obligationId = String(formData.get('obligationId') ?? '');
  const documentId = String(formData.get('documentId') ?? '');
  if (![contractId, obligationId, documentId].every((value) => /^[0-9a-f-]{36}$/i.test(value))) {
    return fail('Selecione uma obrigação e um documento válido.');
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) return fail('API ou identidade não configurada.');
  try {
    const response = await fetch(
      `${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/obligations/${encodeURIComponent(obligationId)}/evidence`,
      {
        method: 'POST', headers: { ...identityHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({ documentId }), cache: 'no-store',
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: string; issues?: Array<{ message: string }> };
      return fail((body.code && messages[body.code]) || body.issues?.[0]?.message
        || 'Não foi possível vincular o documento.');
    }
    revalidatePath(`/contratos/${contractId}`);
    return { ok: true, message: 'Documento vinculado à obrigação, com rastreabilidade.' };
  } catch {
    return fail('Não foi possível acessar a API configurada.');
  }
}

export async function saveContractObligationAction(
  _state: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const contractId = String(formData.get('contractId') ?? '');
  const obligationId = String(formData.get('obligationId') ?? '');
  const payload = {
    title: String(formData.get('title') ?? '').trim(),
    description: nullable(formData.get('description')),
    dueDate: nullable(formData.get('dueDate')),
    responsibleName: nullable(formData.get('responsibleName')),
    ...(obligationId ? { status: String(formData.get('status') ?? 'PENDING') } : {}),
  };
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return fail('A API ou a identidade do ambiente ainda não está configurada.');
  }
  try {
    const suffix = obligationId ? `/obligations/${encodeURIComponent(obligationId)}` : '/obligations';
    const response = await fetch(
      `${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}${suffix}`,
      {
        method: obligationId ? 'PUT' : 'POST',
        headers: { ...identityHeaders, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as {
        code?: string; issues?: Array<{ message: string }>;
      };
      return fail((body.code && messages[body.code]) || body.issues?.[0]?.message
        || 'Não foi possível salvar a obrigação.');
    }
    revalidatePath(`/contratos/${contractId}`);
    revalidatePath('/contratos');
    revalidatePath('/central');
    revalidatePath('/central/fila');
    return {
      ok: true,
      message: obligationId ? 'Obrigação atualizada e auditada.' : 'Obrigação criada e vinculada ao contrato.',
    };
  } catch {
    return fail('Não foi possível acessar a API configurada.');
  }
}

export async function savePurchaseTermsAction(
  _state: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const contractId = String(formData.get('contractId') ?? '');
  const payload = {
    expectedVersion: Number(formData.get('expectedVersion') ?? 0),
    externalNumber: String(formData.get('externalNumber') ?? '').trim(),
    cropYear: String(formData.get('cropYear') ?? '').trim(),
    signedOn: nullable(formData.get('signedOn')),
    pickupLocation: nullable(formData.get('pickupLocation')),
    deliveryCondition: nullable(formData.get('deliveryCondition')),
    freightPayer: nullable(formData.get('freightPayer')),
    weighingResponsibility: nullable(formData.get('weighingResponsibility')),
    qualityTerms: nullable(formData.get('qualityTerms')),
    requiredDocuments: nullable(formData.get('requiredDocuments')),
    paymentTerms: nullable(formData.get('paymentTerms')),
  };
  if (!/^[0-9a-f-]{36}$/i.test(contractId) || !Number.isInteger(payload.expectedVersion)
    || payload.expectedVersion < 0 || !payload.externalNumber || !payload.cropYear) {
    return fail('Informe o número externo e a safra do contrato.');
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) return fail('API ou identidade não configurada.');
  try {
    const response = await fetch(`${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/purchase-terms`, {
      method: 'PUT',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: string; issues?: Array<{ message: string }> };
      return fail((body.code && messages[body.code]) || body.issues?.[0]?.message
        || 'Não foi possível salvar os termos do contrato.');
    }
    revalidatePath(`/contratos/${contractId}`);
    return { ok: true, message: 'Termos salvos, versionados e auditados.' };
  } catch {
    return fail('Não foi possível acessar a API configurada.');
  }
}

export async function createPurchaseAmendmentAction(
  _state: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const contractId = String(formData.get('contractId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion') ?? 0);
  const reason = String(formData.get('reason') ?? '').trim();
  const effectiveOn = String(formData.get('effectiveOn') ?? '');
  const terms = purchaseTermsPayload(formData);
  if (!/^[0-9a-f-]{36}$/i.test(contractId) || !Number.isInteger(expectedVersion)
    || expectedVersion < 1 || reason.length < 3 || !effectiveOn || !terms.externalNumber || !terms.cropYear) {
    return fail('Informe a vigência, o motivo e os termos completos do aditivo.');
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) return fail('API ou identidade não configurada.');
  try {
    const response = await fetch(`${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/amendments`, {
      method: 'POST', headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ expectedVersion, reason, effectiveOn, terms }), cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: string; issues?: Array<{ message: string }> };
      return fail((body.code && messages[body.code]) || body.issues?.[0]?.message || 'Não foi possível registrar o aditivo.');
    }
    revalidatePath(`/contratos/${contractId}`);
    revalidatePath('/contratos');
    return { ok: true, message: 'Aditivo registrado, versionado e auditado.' };
  } catch {
    return fail('Não foi possível acessar a API configurada.');
  }
}

function purchaseTermsPayload(formData: FormData) {
  return {
    externalNumber: String(formData.get('externalNumber') ?? '').trim(),
    cropYear: String(formData.get('cropYear') ?? '').trim(),
    signedOn: nullable(formData.get('signedOn')),
    pickupLocation: nullable(formData.get('pickupLocation')),
    deliveryCondition: nullable(formData.get('deliveryCondition')),
    freightPayer: nullable(formData.get('freightPayer')),
    weighingResponsibility: nullable(formData.get('weighingResponsibility')),
    qualityTerms: nullable(formData.get('qualityTerms')),
    requiredDocuments: nullable(formData.get('requiredDocuments')),
    paymentTerms: nullable(formData.get('paymentTerms')),
  };
}

function nullable(value: FormDataEntryValue | null): string | null {
  return String(value ?? '').trim() || null;
}

function fail(message: string): ContractActionState {
  return { ok: false, message };
}
