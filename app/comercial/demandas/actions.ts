'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../../lib/current-user';

export type DemandActionState = { ok: boolean; message: string; id?: string };
export const initialDemandState: DemandActionState = { ok: false, message: '' };

const messageByCode: Record<string, string> = {
  COMMERCIAL_DEMAND_NOT_FOUND: 'Demanda não encontrada nesta empresa.',
  COMMERCIAL_DEMAND_CLOSED: 'A demanda está encerrada e não pode ser alterada.',
  COMMERCIAL_DEMAND_VERSION_CONFLICT: 'Outra pessoa editou esta demanda. Atualize a tela e revise as alterações.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não tem permissão de edição comercial.',
  COUNTERPARTY_PROFILE_REQUIRED: 'Classifique a contraparte antes de registrar a demanda.',
};

async function send(path: string, method: 'POST' | 'PUT', payload: object): Promise<{ ok: boolean; data: Record<string, unknown>; message: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { ok: false, data: {}, message: 'API ou identidade não configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}${path}`, { method,
      headers: { ...identityHeaders, 'content-type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      const code = String(data.code ?? '');
      const issues = data.issues as Array<{ message?: string }> | undefined;
      return { ok: false, data, message: messageByCode[code] ?? issues?.[0]?.message ?? 'Não foi possível salvar.' };
    }
    return { ok: true, data, message: '' };
  } catch {
    return { ok: false, data: {}, message: 'Não foi possível acessar a API configurada.' };
  }
}

export async function saveDemandAction(_state: DemandActionState, formData: FormData): Promise<DemandActionState> {
  const id = String(formData.get('id') ?? '');
  const payload = {
    counterpartyId: String(formData.get('counterpartyId') ?? ''),
    direction: String(formData.get('direction') ?? ''),
    commodity: String(formData.get('commodity') ?? ''), unit: 'SC_60KG',
    quantitySc: String(formData.get('quantitySc') ?? ''),
    deliveryStart: String(formData.get('deliveryStart') ?? ''),
    deliveryEnd: String(formData.get('deliveryEnd') ?? ''),
    indicativePricePerSc: nullable(formData.get('indicativePricePerSc')),
    description: nullable(formData.get('description')),
    ...(id ? { expectedVersion: Number(formData.get('expectedVersion') ?? 0) } : {}),
  };
  if (!payload.counterpartyId || !payload.quantitySc || !payload.deliveryStart || !payload.deliveryEnd) {
    return { ok: false, message: 'Preencha contraparte, quantidade e janela de entrega.' };
  }
  const result = await send(`/v1/commercial/demands${id ? `/${encodeURIComponent(id)}` : ''}`,
    id ? 'PUT' : 'POST', payload);
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath('/comercial/demandas');
  if (id) revalidatePath(`/comercial/demandas/${id}`);
  return { ok: true, id: String(result.data.id ?? id), message: id ? 'Demanda atualizada e auditada.' : 'Demanda registrada no backend.' };
}

export async function addNegotiationAction(_state: DemandActionState, formData: FormData): Promise<DemandActionState> {
  const id = String(formData.get('id') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  if (!id || note.length < 3) return { ok: false, message: 'Escreva uma nota de negociação.' };
  const result = await send(`/v1/commercial/demands/${encodeURIComponent(id)}/negotiations`, 'POST',
    { note, indicativePricePerSc: nullable(formData.get('indicativePricePerSc')) });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath(`/comercial/demandas/${id}`);
  revalidatePath('/comercial/demandas');
  return { ok: true, message: 'Negociação registrada no histórico.' };
}

export async function closeDemandAction(_state: DemandActionState, formData: FormData): Promise<DemandActionState> {
  const id = String(formData.get('id') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!id || reason.length < 3) return { ok: false, message: 'Informe o motivo do encerramento.' };
  const result = await send(`/v1/commercial/demands/${encodeURIComponent(id)}/close`, 'POST', { reason });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath(`/comercial/demandas/${id}`);
  revalidatePath('/comercial/demandas');
  return { ok: true, message: 'Demanda encerrada. O histórico foi preservado.' };
}

function nullable(value: FormDataEntryValue | null): string | null {
  return String(value ?? '').trim() || null;
}
