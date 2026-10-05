'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../../lib/current-user';

export type FinanceActionState = { ok: boolean; message: string };

const messages: Record<string, string> = {
  FINANCIAL_EVENT_NOT_FOUND: 'A previsão financeira não foi encontrada.',
  ROUNDING_POLICY_REQUIRED: 'O valor possui fração de centavo. Configure a política de arredondamento antes de emitir o título.',
  FINANCIAL_TITLE_ALREADY_EXISTS: 'Essa previsão já possui um título ou a numeração está em uso.',
  FINANCIAL_TITLE_NOT_FOUND: 'O título financeiro não foi encontrado.',
  SETTLEMENT_EXCEEDS_TITLE_BALANCE: 'O recebimento ultrapassa o saldo em aberto do título.',
  BANK_REFERENCE_ALREADY_USED: 'Essa referência bancária já foi utilizada.',
  FINANCIAL_SETTLEMENT_NOT_FOUND: 'O recebimento não foi encontrado.',
  SETTLEMENT_ALREADY_REVERSED: 'Esse recebimento já foi estornado.',
  RECEIVABLE_PAYMENT_FLOW_NOT_AVAILABLE: 'Este título é a receber e não aceita registro de pagamento.',
  PAYABLE_SOURCE_REQUIRED: 'O pagamento precisa estar vinculado a uma compra ou obrigação fiscal.',
  PAYMENT_EXCEEDS_TITLE_BALANCE: 'O pagamento ultrapassa o saldo em aberto do título.',
  PAYMENT_BANK_REFERENCE_ALREADY_USED: 'Essa referência bancária de pagamento já foi utilizada.',
  FINANCIAL_PAYMENT_NOT_FOUND: 'O pagamento não foi encontrado.',
  PAYMENT_ALREADY_REVERSED: 'Esse pagamento já foi estornado.',
  CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para esta operação.',
  PURCHASE_PAYABLE_TITLE_NOT_FOUND: 'A compra precisa ter nota fiscal validada e título emitido.',
  FINANCE_POLICY_REQUIRED: 'Configure a alçada financeira antes de enviar o lote.',
  FOUR_EYES_APPROVER_REQUIRED: 'Quem criou o lote não pode aprová-lo. É necessário outro aprovador.',
  PAYMENT_BATCH_ITEM_EXCEEDS_BALANCE: 'Um item do lote ultrapassa o saldo do título.',
  BANK_RECONCILIATION_MISMATCH: 'O valor ou a direção do extrato não corresponde ao movimento.',
};

export async function createPurchaseCostComponentAction(_state: FinanceActionState, formData: FormData) {
  return send('/v1/finance/purchase-cost-components', {
    financialEventId: String(formData.get('financialEventId') ?? ''),
    componentType: String(formData.get('componentType') ?? ''),
    payableImpact: String(formData.get('payableImpact') ?? ''),
    amount: decimal(formData.get('amount')),
    description: String(formData.get('description') ?? ''),
    externalReference: String(formData.get('externalReference') ?? '').trim() || null,
  }, 'Componente da compra registrado e saldo recalculado.');
}

export async function configureFinancePolicyAction(_state: FinanceActionState, formData: FormData) {
  return send('/v1/finance/policies', {
    paymentApprovalThreshold: decimal(formData.get('paymentApprovalThreshold')),
  }, 'Política de alçada versionada e ativada.');
}

export async function createPaymentBatchAction(_state: FinanceActionState, formData: FormData) {
  return send('/v1/finance/payment-batches', {
    reference: String(formData.get('reference') ?? ''),
    scheduledOn: String(formData.get('scheduledOn') ?? ''),
    items: [{ titleId: String(formData.get('titleId') ?? ''), amount: decimal(formData.get('amount')) }],
  }, 'Lote de pagamento criado em rascunho.');
}

export async function submitPaymentBatchAction(_state: FinanceActionState, formData: FormData) {
  return send(`/v1/finance/payment-batches/${encodeURIComponent(String(formData.get('batchId') ?? ''))}/submit`, {}, 'Lote enviado para a alçada aplicável.');
}

export async function approvePaymentBatchAction(_state: FinanceActionState, formData: FormData) {
  return send(`/v1/finance/payment-batches/${encodeURIComponent(String(formData.get('batchId') ?? ''))}/approve`, {}, 'Lote aprovado com segregação de função.');
}

export async function executePaymentBatchAction(_state: FinanceActionState, formData: FormData) {
  return send(`/v1/finance/payment-batches/${encodeURIComponent(String(formData.get('batchId') ?? ''))}/execute`, {}, 'Lote executado e títulos atualizados.');
}

export async function createBankAccountAction(_state: FinanceActionState, formData: FormData) {
  return send('/v1/finance/bank-accounts', {
    code: String(formData.get('code') ?? '').toUpperCase(), name: String(formData.get('name') ?? ''),
  }, 'Conta bancária cadastrada.');
}

export async function createBankStatementEntryAction(_state: FinanceActionState, formData: FormData) {
  const local = String(formData.get('occurredAt') ?? '');
  return send('/v1/finance/bank-statement-entries', {
    bankAccountId: String(formData.get('bankAccountId') ?? ''), occurredAt: local ? `${local}:00-03:00` : '',
    direction: String(formData.get('direction') ?? ''), amount: decimal(formData.get('amount')),
    bankReference: String(formData.get('bankReference') ?? ''),
    description: String(formData.get('description') ?? '').trim() || null,
  }, 'Lançamento de extrato importado.');
}

export async function reconcileBankStatementEntryAction(_state: FinanceActionState, formData: FormData) {
  return send(`/v1/finance/bank-statement-entries/${encodeURIComponent(String(formData.get('entryId') ?? ''))}/reconcile`, {
    matchedType: String(formData.get('matchedType') ?? ''), matchedId: String(formData.get('matchedId') ?? ''),
  }, 'Movimento conciliado com o extrato.');
}

export async function createTitleAction(
  _state: FinanceActionState, formData: FormData,
): Promise<FinanceActionState> {
  return send('/v1/finance/titles', {
    financialEventId: String(formData.get('financialEventId') ?? ''),
    titleNumber: String(formData.get('titleNumber') ?? ''),
    documentReference: String(formData.get('documentReference') ?? ''),
    dueDate: String(formData.get('dueDate') ?? ''),
  }, 'Título a receber emitido.');
}

export async function settleTitleAction(
  _state: FinanceActionState, formData: FormData,
): Promise<FinanceActionState> {
  const local = String(formData.get('receivedAt') ?? '');
  return send(`/v1/finance/titles/${encodeURIComponent(String(formData.get('titleId') ?? ''))}/settlements`, {
    amount: decimal(formData.get('amount')),
    receivedAt: local ? `${local}:00-03:00` : '',
    bankReference: String(formData.get('bankReference') ?? ''),
    notes: String(formData.get('notes') ?? '').trim() || null,
  }, 'Recebimento registrado e saldo atualizado.');
}

export async function reverseSettlementAction(
  _state: FinanceActionState, formData: FormData,
): Promise<FinanceActionState> {
  return send(`/v1/finance/settlements/${encodeURIComponent(String(formData.get('settlementId') ?? ''))}/reverse`, {
    reason: String(formData.get('reason') ?? ''),
  }, 'Recebimento estornado sem apagar o histórico.');
}

export async function payTitleAction(
  _state: FinanceActionState, formData: FormData,
): Promise<FinanceActionState> {
  const local = String(formData.get('paidAt') ?? '');
  return send(`/v1/finance/titles/${encodeURIComponent(String(formData.get('titleId') ?? ''))}/payments`, {
    amount: decimal(formData.get('amount')),
    paidAt: local ? `${local}:00-03:00` : '',
    bankReference: String(formData.get('bankReference') ?? ''),
    notes: String(formData.get('notes') ?? '').trim() || null,
  }, 'Pagamento registrado e saldos atualizados.');
}

export async function reversePaymentAction(
  _state: FinanceActionState, formData: FormData,
): Promise<FinanceActionState> {
  return send(`/v1/finance/payments/${encodeURIComponent(String(formData.get('paymentId') ?? ''))}/reverse`, {
    reason: String(formData.get('reason') ?? ''),
  }, 'Pagamento estornado sem apagar o histórico.');
}

async function send(path: string, payload: unknown, success: string): Promise<FinanceActionState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { identityHeaders } = await currentUserContext();
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { ok: false, message: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST', headers: { ...identityHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store',
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
    revalidatePath('/financeiro');
    return { ok: true, message: success };
  } catch {
    return { ok: false, message: 'Não foi possível acessar a API configurada.' };
  }
}

function decimal(value: FormDataEntryValue | null): string {
  return String(value ?? '').replace(/\./g, '').replace(',', '.');
}
