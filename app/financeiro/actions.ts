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
  COMMISSION_SOURCE_NOT_FOUND: 'A política e o evento selecionados não formam uma base válida de comissão.',
  COMMISSION_POLICY_NOT_ACTIVE: 'A política de comissão precisa estar ativa.',
  COMMISSION_POLICY_COMMODITY_MISMATCH: 'A commodity do evento não corresponde à política.',
  COMMISSION_POLICY_OUTSIDE_EFFECTIVE_PERIOD: 'O evento está fora da vigência da política.',
  COMMISSION_ROUNDING_POLICY_REQUIRED: 'O cálculo gera fração de centavo. A política de arredondamento precisa ser homologada.',
  COMMISSION_ALREADY_ACCRUED: 'Este evento já possui comissão apropriada por essa política.',
  ACTIVE_BANK_ACCOUNT_NOT_FOUND: 'Selecione uma conta bancária ativa.',
  BANK_STATEMENT_ADAPTER_NOT_AVAILABLE: 'Esse formato ainda não possui adaptador homologado.',
};

export async function createCommissionPolicyAction(_state: FinanceActionState, formData: FormData) {
  return send('/v1/finance/commission-policies', {
    code: String(formData.get('code') ?? '').toUpperCase(),
    name: String(formData.get('name') ?? ''),
    status: String(formData.get('status') ?? 'DRAFT'),
    basis: 'FINANCIAL_EVENT_AMOUNT',
    ratePct: decimal(formData.get('ratePct')),
    commodity: String(formData.get('commodity') ?? '').trim() || null,
    beneficiaryName: String(formData.get('beneficiaryName') ?? ''),
    effectiveFrom: String(formData.get('effectiveFrom') ?? ''),
    effectiveTo: String(formData.get('effectiveTo') ?? '').trim() || null,
  }, 'Política de comissão versionada e salva.');
}

export async function accrueCommissionAction(_state: FinanceActionState, formData: FormData) {
  return send('/v1/finance/commission-accruals', {
    policyId: String(formData.get('policyId') ?? ''),
    financialEventId: String(formData.get('financialEventId') ?? ''),
  }, 'Comissão calculada e apropriada com memória auditável.');
}

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

export async function importBankStatementAction(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const file = formData.get('statementFile');
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Selecione um arquivo CSV.' };
  if (file.size > 2_000_000) return { ok: false, message: 'O arquivo deve ter no máximo 2 MB.' };
  try {
    const entries = parseTierTradeCsv(await file.text());
    const result = await send('/v1/finance/bank-statement-imports', {
      bankAccountId: String(formData.get('bankAccountId') ?? ''), sourceFormat: 'TIER_TRADE_CSV',
      originalFileName: file.name, adapterVersion: 'tier-trade-csv-v1',
      mapping: { data: 'occurredAt', direcao: 'direction', valor: 'amount', referencia: 'bankReference', descricao: 'description' },
      entries,
    }, `${entries.length} lançamento(s) processado(s). Duplicidades são ignoradas pelo backend.`);
    return result;
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Não foi possível interpretar o arquivo.' };
  }
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

function parseTierTradeCsv(content: string) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('O CSV precisa conter cabeçalho e ao menos um lançamento.');
  if (lines.length > 1001) throw new Error('O arquivo excede o limite de 1.000 lançamentos por lote.');
  const delimiter = lines[0]!.includes(';') ? ';' : ',';
  const header = parseCsvLine(lines[0]!, delimiter).map((value) => normalizeHeader(value));
  const required = ['data', 'direcao', 'valor', 'referencia'];
  if (required.some((column) => !header.includes(column))) {
    throw new Error('Use as colunas data, direcao, valor, referencia e, opcionalmente, descricao.');
  }
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line, delimiter);
    const row = Object.fromEntries(header.map((column, columnIndex) => [column, values[columnIndex]?.trim() ?? '']));
    const direction = normalizeHeader(row.direcao) === 'credito' ? 'CREDIT'
      : normalizeHeader(row.direcao) === 'debito' ? 'DEBIT' : null;
    const occurredAt = normalizeStatementDate(row.data);
    const amount = normalizeStatementAmount(row.valor);
    if (!direction || !occurredAt || !amount || !row.referencia) throw new Error(`Linha ${index + 2}: data, direção, valor ou referência inválidos.`);
    return { sourceLineNumber: index + 2, occurredAt, direction, amount,
      bankReference: row.referencia.slice(0, 80), description: row.descricao?.slice(0, 500) || null };
  });
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = []; let cell = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]!;
    if (character === '"' && quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) { cells.push(cell); cell = ''; }
    else cell += character;
  }
  if (quoted) throw new Error('O CSV contém aspas não fechadas.');
  cells.push(cell); return cells;
}

function normalizeHeader(value: string | undefined): string {
  return String(value ?? '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeStatementDate(value: string | undefined): string | null {
  const text = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return `${text}:00-03:00`;
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}T${match[4] ?? '12'}:${match[5] ?? '00'}:00-03:00` : null;
}

function normalizeStatementAmount(value: string | undefined): string | null {
  const text = String(value ?? '').trim().replace(/\s/g, '');
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
  return /^\d+(?:\.\d{1,2})?$/.test(normalized) && Number(normalized) > 0 ? Number(normalized).toFixed(2) : null;
}
