'use server';

import { normalizeDecimalInput } from '@mountier/tier-trade-design-system';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../../lib/current-user';

export async function publishMarginPolicy(formData: FormData) {
  const commodity = String(formData.get('commodity') ?? '');
  if (commodity !== 'MILHO' && commodity !== 'SOJA') redirect('/comercial/politica-margem?resultado=invalido');
  const autoApprovalMarginPerSc = normalizeDecimalInput(String(formData.get('autoApprovalMarginPerSc') ?? ''), 2);
  const absoluteFloorMarginPerSc = normalizeDecimalInput(String(formData.get('absoluteFloorMarginPerSc') ?? ''), 2);
  if (!autoApprovalMarginPerSc || !absoluteFloorMarginPerSc) {
    redirect('/comercial/politica-margem?resultado=invalido');
  }
  const { identityHeaders } = await currentUserContext();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    redirect('/comercial/politica-margem?resultado=indisponivel');
  }
  let result: 'salvo' | 'permissao' | 'invalido' | 'indisponivel' = 'indisponivel';
  try {
    const response = await fetch(`${apiUrl}/v1/settings/margin-policy`, {
      method: 'PATCH', cache: 'no-store',
      headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ commodity, autoApprovalMarginPerSc, absoluteFloorMarginPerSc }),
    });
    result = response.ok ? 'salvo' : response.status === 403 ? 'permissao'
      : response.status === 400 || response.status === 422 ? 'invalido' : 'indisponivel';
  } catch { /* A página informa que a API está indisponível. */ }
  if (result === 'salvo') revalidatePath('/comercial/politica-margem');
  redirect(`/comercial/politica-margem?resultado=${result}`);
}
