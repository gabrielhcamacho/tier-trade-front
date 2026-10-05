'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

export type ContractActionState = { ok: boolean; message: string };

const messages: Record<string, string> = {
  CONTRACT_NOT_FOUND: 'O contrato não foi encontrado.',
  CONTRACT_NOT_ACTIVE: 'Somente contratos ativos aceitam novas obrigações.',
  CONTRACT_OBLIGATION_NOT_FOUND: 'A obrigação não existe ou não pertence a este contrato.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para alterar obrigações contratuais.',
};

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

function nullable(value: FormDataEntryValue | null): string | null {
  return String(value ?? '').trim() || null;
}

function fail(message: string): ContractActionState {
  return { ok: false, message };
}
