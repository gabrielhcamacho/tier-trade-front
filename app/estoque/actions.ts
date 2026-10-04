'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

export type FulfillmentState = { ok: boolean; message: string };
export const initialFulfillmentState: FulfillmentState = { ok: false, message: '' };

const messages: Record<string, string> = {
  SALES_CONTRACT_REFERENCE_EXISTS: 'Já existe um contrato de venda com essa referência.',
  SALES_CONTRACT_BELOW_ALLOCATED_BALANCE: 'O volume não pode ficar abaixo do que já foi alocado.',
  ALLOCATION_EXCEEDS_LOT_AVAILABILITY: 'A alocação ultrapassa o saldo disponível do lote.',
  ALLOCATION_EXCEEDS_CONTRACT_BALANCE: 'A alocação ultrapassa o saldo do contrato de venda.',
  DISPATCH_EXCEEDS_ALLOCATION_BALANCE: 'A expedição ultrapassa o saldo ainda alocado.',
  DISPATCH_EXCEEDS_PHYSICAL_BALANCE: 'A expedição ultrapassa o estoque físico.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para esta operação.',
  COUNTERPARTY_PROFILE_REQUIRED: 'Classifique a contraparte antes de criar o contrato de venda.',
};

export async function saveSalesContractAction(
  _state: FulfillmentState, formData: FormData,
): Promise<FulfillmentState> {
  const contractId = String(formData.get('contractId') ?? '');
  return send(
    contractId ? `/v1/inventory/sales-contracts/${encodeURIComponent(contractId)}` : '/v1/inventory/sales-contracts',
    contractId ? 'PUT' : 'POST',
    {
      counterpartyId: String(formData.get('counterpartyId') ?? ''),
      reference: String(formData.get('reference') ?? ''),
      commodity: String(formData.get('commodity') ?? ''),
      quantityKg: decimal(formData.get('quantityKg')), salePricePerKg: decimal(formData.get('salePricePerKg')),
      destinationCode: String(formData.get('destinationCode') ?? ''),
      deliveryStart: String(formData.get('deliveryStart') ?? ''),
      deliveryEnd: String(formData.get('deliveryEnd') ?? ''),
      requiredDocuments: String(formData.get('requiredDocuments') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
      paymentTermDays: optionalInteger(formData.get('paymentTermDays')),
    }, contractId ? 'Contrato de venda atualizado.' : 'Contrato de venda criado.',
  );
}

export async function allocateInventoryAction(
  _state: FulfillmentState, formData: FormData,
): Promise<FulfillmentState> {
  return send('/v1/inventory/allocations', 'POST', {
    salesContractId: String(formData.get('salesContractId') ?? ''),
    lotId: String(formData.get('lotId') ?? ''), quantityKg: decimal(formData.get('quantityKg')),
  }, 'Estoque alocado ao contrato de venda.');
}

export async function dispatchInventoryAction(
  _state: FulfillmentState, formData: FormData,
): Promise<FulfillmentState> {
  const local = String(formData.get('dispatchedAt') ?? '');
  return send('/v1/inventory/dispatches', 'POST', {
    allocationId: String(formData.get('allocationId') ?? ''), quantityKg: decimal(formData.get('quantityKg')),
    dispatchedAt: local ? `${local}:00-03:00` : '',
    vehiclePlate: String(formData.get('vehiclePlate') ?? ''),
    documentReference: String(formData.get('documentReference') ?? ''),
    notes: String(formData.get('notes') ?? '').trim() || null,
  }, 'Expedição registrada e estoque baixado.');
}

async function send(path: string, method: 'POST' | 'PUT', payload: unknown, success: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { ok: false, message: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method, headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: string; issues?: Array<{ message: string }> };
      return { ok: false, message: (body.code && messages[body.code]) || body.issues?.[0]?.message || 'Não foi possível concluir a operação.' };
    }
    revalidatePath('/estoque'); revalidatePath('/contratos');
    return { ok: true, message: success };
  } catch {
    return { ok: false, message: 'Não foi possível acessar a API configurada.' };
  }
}

function decimal(value: FormDataEntryValue | null): string {
  return String(value ?? '').replace(/\./g, '').replace(',', '.');
}

function optionalInteger(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim();
  return text ? Number.parseInt(text, 10) : null;
}
