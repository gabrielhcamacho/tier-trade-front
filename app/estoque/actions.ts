'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

import type { FulfillmentState } from './action-state';

const messages: Record<string, string> = {
  SALES_CONTRACT_REFERENCE_EXISTS: 'Já existe um contrato de venda com essa referência.',
  SALES_CONTRACT_BELOW_ALLOCATED_BALANCE: 'O volume não pode ficar abaixo do que já foi alocado.',
  ALLOCATION_EXCEEDS_LOT_AVAILABILITY: 'A alocação ultrapassa o saldo disponível do lote.',
  ALLOCATION_EXCEEDS_CONTRACT_BALANCE: 'A alocação ultrapassa o saldo do contrato de venda.',
  DISPATCH_EXCEEDS_ALLOCATION_BALANCE: 'A expedição ultrapassa o saldo ainda alocado.',
  DISPATCH_EXCEEDS_PHYSICAL_BALANCE: 'A expedição ultrapassa o estoque físico.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para esta operação.',
  COUNTERPARTY_PROFILE_REQUIRED: 'Classifique a contraparte antes de criar o contrato de venda.',
  INVENTORY_LOCATION_CODE_EXISTS: 'Já existe uma localização com esse código.',
  INVENTORY_LOT_NOT_IN_STORAGE: 'O lote precisa estar armazenado para iniciar o remaneio.',
  TRANSFER_DESTINATION_EQUALS_SOURCE: 'Escolha uma localização diferente da atual.',
  TRANSFER_COMPLETION_PRECEDES_START: 'A conclusão não pode ser anterior ao início do remaneio.',
  LOSS_EXCEEDS_PHYSICAL_BALANCE: 'A perda ultrapassa o saldo físico do lote.',
  LOSS_WOULD_BREAK_ACTIVE_ALLOCATIONS: 'A perda deixaria o lote abaixo do volume já alocado.',
  COUNT_BELOW_ACTIVE_ALLOCATIONS: 'A contagem está abaixo do volume reservado em alocações ativas.',
  SALES_CONTRACT_NOT_DRAFT: 'Somente contratos de venda em rascunho podem ser editados diretamente.',
  SIGNED_SALES_CONTRACT_EVIDENCE_REQUIRED: 'Anexe o contrato de venda assinado e registre a assinatura concluída.',
  INVALID_SALES_CONTRACT_STATUS_TRANSITION: 'Esta mudança de situação não é permitida.',
  ACTIVE_ALLOCATIONS_PREVENT_SALES_CONTRACT_CLOSURE: 'Conclua as alocações ativas antes de encerrar o contrato.',
  SALES_CONTRACT_BALANCE_PREVENTS_CLOSURE: 'O volume expedido ainda não cobre o volume contratado.',
  DISPATCHED_SALES_CONTRACT_CANNOT_BE_CANCELLED: 'Um contrato com expedição registrada não pode ser cancelado.',
  ONLY_ACTIVE_SALES_CONTRACTS_ACCEPT_AMENDMENTS: 'O aditivo só pode ser registrado em contrato de venda ativo.',
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

export async function transitionSalesContractAction(
  _state: FulfillmentState, formData: FormData,
): Promise<FulfillmentState> {
  const contractId = String(formData.get('contractId') ?? '');
  const status = String(formData.get('status') ?? '');
  const reason = optional(formData.get('reason'));
  return send(`/v1/inventory/sales-contracts/${encodeURIComponent(contractId)}/transition`, 'POST',
    { status, reason }, 'Situação do contrato de venda atualizada e versionada.');
}

export async function amendSalesContractAction(
  _state: FulfillmentState, formData: FormData,
): Promise<FulfillmentState> {
  const contractId = String(formData.get('contractId') ?? '');
  return send(`/v1/inventory/sales-contracts/${encodeURIComponent(contractId)}/amendments`, 'POST', {
    reason: String(formData.get('reason') ?? '').trim(),
    effectiveOn: String(formData.get('effectiveOn') ?? ''),
    terms: {
      counterpartyId: String(formData.get('counterpartyId') ?? ''),
      reference: String(formData.get('reference') ?? ''),
      commodity: String(formData.get('commodity') ?? ''),
      quantityKg: decimal(formData.get('quantityKg')),
      salePricePerKg: decimal(formData.get('salePricePerKg')),
      destinationCode: String(formData.get('destinationCode') ?? ''),
      deliveryStart: String(formData.get('deliveryStart') ?? ''),
      deliveryEnd: String(formData.get('deliveryEnd') ?? ''),
      requiredDocuments: String(formData.get('requiredDocuments') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
      paymentTermDays: optionalInteger(formData.get('paymentTermDays')),
    },
  }, 'Aditivo de venda registrado, versionado e auditado.');
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

export async function createLocationAction(_state: FulfillmentState, formData: FormData) {
  return send('/v1/inventory/locations', 'POST', {
    code: String(formData.get('code') ?? ''), name: String(formData.get('name') ?? ''),
  }, 'Localização criada.');
}

export async function classifyLotAction(_state: FulfillmentState, formData: FormData) {
  return send(`/v1/inventory/lots/${encodeURIComponent(String(formData.get('lotId') ?? ''))}/classification`, 'PUT', {
    ownershipStatus: String(formData.get('ownershipStatus') ?? ''),
    riskStatus: String(formData.get('riskStatus') ?? ''),
    custodyStatus: String(formData.get('custodyStatus') ?? ''),
    ownerCounterpartyId: optional(formData.get('ownerCounterpartyId')),
    custodianCounterpartyId: optional(formData.get('custodianCounterpartyId')),
    occurredAt: localTimestamp(formData.get('occurredAt'), formData.get('timezoneOffsetMinutes')), reason: String(formData.get('reason') ?? ''),
  }, 'Classificação do lote atualizada.');
}

export async function startTransferAction(_state: FulfillmentState, formData: FormData) {
  return send(`/v1/inventory/lots/${encodeURIComponent(String(formData.get('lotId') ?? ''))}/transfers`, 'POST', {
    destinationLocationId: String(formData.get('destinationLocationId') ?? ''),
    startedAt: localTimestamp(formData.get('startedAt'), formData.get('timezoneOffsetMinutes')), reason: String(formData.get('reason') ?? ''),
  }, 'Remaneio iniciado.');
}

export async function completeTransferAction(_state: FulfillmentState, formData: FormData) {
  return send(`/v1/inventory/transfers/${encodeURIComponent(String(formData.get('transferId') ?? ''))}/complete`, 'POST', {
    completedAt: localTimestamp(formData.get('completedAt'), formData.get('timezoneOffsetMinutes')), reason: String(formData.get('reason') ?? ''),
  }, 'Remaneio concluído.');
}

export async function recordLossAction(_state: FulfillmentState, formData: FormData) {
  return send(`/v1/inventory/lots/${encodeURIComponent(String(formData.get('lotId') ?? ''))}/losses`, 'POST', {
    quantityKg: decimal(formData.get('quantityKg')), occurredAt: localTimestamp(formData.get('occurredAt'), formData.get('timezoneOffsetMinutes')),
    reason: String(formData.get('reason') ?? ''),
  }, 'Perda registrada no livro de estoque.');
}

export async function reconcileCountAction(_state: FulfillmentState, formData: FormData) {
  return send(`/v1/inventory/lots/${encodeURIComponent(String(formData.get('lotId') ?? ''))}/counts`, 'POST', {
    countedQuantityKg: decimal(formData.get('countedQuantityKg')),
    occurredAt: localTimestamp(formData.get('occurredAt'), formData.get('timezoneOffsetMinutes')), reason: String(formData.get('reason') ?? ''),
  }, 'Inventário físico conciliado.');
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
    revalidatePath('/estoque'); revalidatePath('/contratos'); revalidatePath('/comercial/vendas');
    if (path.includes('/sales-contracts/')) {
      const id = path.split('/sales-contracts/')[1]?.split('/')[0];
      if (id) revalidatePath(`/comercial/vendas/${id}`);
    }
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

function optional(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim(); return text || null;
}

function localTimestamp(value: FormDataEntryValue | null, offsetValue: FormDataEntryValue | null): string {
  const text = String(value ?? '');
  if (!text) return '';
  const offsetMinutes = Number(offsetValue ?? 0);
  const sign = offsetMinutes > 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `${text}:00${sign}${hours}:${minutes}`;
}
