'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../../lib/current-user';

export type ReceiptActionState = { ok: boolean; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para registrar o recebimento.',
  LOAD_NOT_FOUND: 'A carga não existe ou não pertence ao tenant autenticado.',
  LOAD_NOT_SCHEDULED: 'Somente uma carga programada pode iniciar o recebimento.',
  LOAD_NOT_IN_RECEIVING: 'Inicie o recebimento antes de registrar a pesagem.',
  GROSS_WEIGHT_MUST_EXCEED_TARE: 'O peso bruto deve ser maior que a tara.',
  WEIGHT_DIFFERENCE_REASON_REQUIRED: 'Explique por que os pesos documental, de chegada, considerado ou aceito são diferentes.',
  LOAD_EXCEEDS_CONTRACT_BALANCE: 'O peso informado ultrapassa o saldo disponível do contrato.',
  LOAD_OUTSIDE_CONTRACT_DELIVERY_WINDOW: 'A data está fora da janela de entrega do contrato.',
  LOAD_HAS_RECEIPT: 'Esta carga já possui pesagem registrada e não pode ser reprogramada ou cancelada.',
  CONTRACT_NOT_ACTIVE: 'O contrato precisa estar ativo para reprogramar a carga.',
};

export async function rescheduleLoadAction(
  _previousState: ReceiptActionState,
  formData: FormData,
): Promise<ReceiptActionState> {
  return mutateLoad(formData, 'schedule', 'PUT', {
    scheduledLocal: String(formData.get('scheduledLocal') ?? ''),
    expectedWeightKg: decimal(formData.get('expectedWeightKg')),
    vehiclePlate: String(formData.get('vehiclePlate') ?? ''),
    carrierName: String(formData.get('carrierName') ?? ''),
    destinationCode: String(formData.get('destinationCode') ?? ''),
    reason: String(formData.get('reason') ?? '').trim(),
  }, 'Programação atualizada. O saldo do contrato foi recalculado.');
}

export async function cancelLoadAction(
  _previousState: ReceiptActionState,
  formData: FormData,
): Promise<ReceiptActionState> {
  return mutateLoad(formData, 'cancel', 'POST', {
    reason: String(formData.get('reason') ?? '').trim(),
  }, 'Carga cancelada. O peso previsto voltou ao saldo do contrato.');
}

export async function startReceivingAction(
  _previousState: ReceiptActionState,
  formData: FormData,
): Promise<ReceiptActionState> {
  return mutateLoad(formData, 'start-receiving', 'POST', null, 'Recebimento iniciado.');
}

export async function recordReceiptAction(
  _previousState: ReceiptActionState,
  formData: FormData,
): Promise<ReceiptActionState> {
  const weighingMode = String(formData.get('weighingMode') ?? 'SCALE');
  const qualityDecision = String(formData.get('qualityDecision') ?? 'REVIEW_REQUIRED');
  const payload = {
    receivedAt: localDateTimeWithOffset(
      String(formData.get('receivedAtLocal') ?? ''),
      Number(formData.get('timezoneOffsetMinutes') ?? 0),
    ),
    inboundInvoiceNumber: String(formData.get('inboundInvoiceNumber') ?? '').trim(),
    inboundInvoiceSeries: String(formData.get('inboundInvoiceSeries') ?? '').trim(),
    inboundInvoiceAccessKey: nullableDigits(formData.get('inboundInvoiceAccessKey')),
    documentWeightKg: decimal(formData.get('documentWeightKg')),
    grossWeightKg: decimal(formData.get('grossWeightKg')),
    tareWeightKg: decimal(formData.get('tareWeightKg')),
    consideredWeightKg: decimal(formData.get('consideredWeightKg')),
    acceptedWeightKg: qualityDecision === 'ACCEPTED' ? decimal(formData.get('acceptedWeightKg')) : null,
    weightDecisionReason: nullable(formData.get('weightDecisionReason')),
    weighingMode,
    scaleTicketNumber: weighingMode === 'SCALE' ? nullable(formData.get('scaleTicketNumber')) : null,
    contingencyReason: weighingMode === 'MANUAL_CONTINGENCY' ? nullable(formData.get('contingencyReason')) : null,
    moisturePct: decimal(formData.get('moisturePct')),
    impurityPct: decimal(formData.get('impurityPct')),
    damagedPct: decimal(formData.get('damagedPct')),
    qualityDecision,
    notes: nullable(formData.get('notes')),
  };
  return mutateLoad(formData, 'receipt', 'PUT', payload, 'Pesagem e classificação registradas.');
}

async function mutateLoad(
  formData: FormData,
  suffix: string,
  method: 'POST' | 'PUT',
  payload: object | null,
  successMessage: string,
): Promise<ReceiptActionState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const loadId = String(formData.get('loadId') ?? '');
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || !loadId || Object.keys(identityHeaders).length === 0) {
    return { ok: false, message: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/loads/${encodeURIComponent(loadId)}/${suffix}`, {
      method,
      headers: { ...identityHeaders, ...(payload ? { 'content-type': 'application/json' } : {}) },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: string; message?: string | string[] };
      const fallback = Array.isArray(body.message) ? body.message[0] : body.message;
      return { ok: false, message: (body.code && ERROR_MESSAGES[body.code]) || fallback || 'Não foi possível atualizar a carga.' };
    }
    revalidatePath(`/cargas/${loadId}`);
    revalidatePath('/cargas');
    return { ok: true, message: successMessage };
  } catch {
    return { ok: false, message: 'Não foi possível acessar a API. Confirme se o backend está em execução.' };
  }
}

function decimal(value: FormDataEntryValue | null): string {
  return String(value ?? '').replace(/\./g, '').replace(',', '.');
}

function nullable(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim();
  return text || null;
}

function nullableDigits(value: FormDataEntryValue | null): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits || null;
}

function localDateTimeWithOffset(local: string, offsetMinutes: number): string {
  const sign = offsetMinutes > 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `${local}:00${sign}${hours}:${minutes}`;
}
