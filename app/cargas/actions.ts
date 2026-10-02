'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

export type ScheduleLoadState = { ok: boolean; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  LOAD_EXCEEDS_CONTRACT_BALANCE: 'O peso informado ultrapassa o saldo disponível do contrato.',
  LOAD_OUTSIDE_CONTRACT_DELIVERY_WINDOW: 'A data está fora da janela de entrega do contrato.',
  CONTRACT_NOT_ACTIVE: 'Somente contratos ativos aceitam programação.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para programar cargas.',
};

export async function scheduleLoadAction(
  _previousState: ScheduleLoadState,
  formData: FormData,
): Promise<ScheduleLoadState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const contractId = String(formData.get('contractId') ?? '');
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || !contractId || Object.keys(identityHeaders).length === 0) {
    return { ok: false, message: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }

  const payload = {
    scheduledLocal: String(formData.get('scheduledLocal') ?? ''),
    expectedWeightKg: String(formData.get('expectedWeightKg') ?? '').replace(/\./g, '').replace(',', '.'),
    vehiclePlate: String(formData.get('vehiclePlate') ?? ''),
    carrierName: String(formData.get('carrierName') ?? ''),
    destinationCode: String(formData.get('destinationCode') ?? ''),
  };

  try {
    const response = await fetch(`${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/loads`, {
      method: 'POST',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: string; message?: string | string[] };
      const fallback = Array.isArray(body.message) ? body.message[0] : body.message;
      return { ok: false, message: (body.code && ERROR_MESSAGES[body.code]) || fallback || 'Não foi possível programar a carga.' };
    }
    revalidatePath('/cargas');
    return { ok: true, message: 'Carga programada com sucesso.' };
  } catch {
    return { ok: false, message: 'Não foi possível acessar a API. Confirme se o backend está em execução.' };
  }
}
