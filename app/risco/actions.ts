'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

export type RiskActionState = { ok: boolean; message: string };

export async function configureRiskPolicyAction(
  _state: RiskActionState, formData: FormData,
): Promise<RiskActionState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { ok: false, message: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/risk/policy`, {
      method: 'PATCH',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        commodity: String(formData.get('commodity') ?? ''),
        maxNetOpenKg: decimal(formData.get('maxNetOpenKg')),
        warningThresholdPct: decimal(formData.get('warningThresholdPct')),
      }),
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as {
        code?: string; issues?: Array<{ message: string }>;
      };
      return {
        ok: false,
        message: body.code === 'CAPABILITY_NOT_FOUND'
          ? 'Seu usuário não possui permissão para configurar limites.'
          : body.issues?.[0]?.message ?? 'Não foi possível salvar a política de risco.',
      };
    }
    revalidatePath('/risco');
    return { ok: true, message: 'Nova versão da política salva e posição recalculada.' };
  } catch {
    return { ok: false, message: 'Não foi possível acessar a API configurada.' };
  }
}

function decimal(value: FormDataEntryValue | null): string {
  return String(value ?? '').replace(/\./g, '').replace(',', '.');
}
