export type FinancialTitle = {
  id: string;
  number: string;
  documentReference: string;
  dueDate: string;
  amount: string;
  status: string;
  settledAmount: string;
  adjustedAmount: string;
  outstandingAmount: string;
};

export type FinancialEvent = {
  id: string;
  eventType: 'SALE_DISPATCH_RECEIVABLE' | 'TAX_OBLIGATION_PAYABLE' | 'PURCHASE_RECEIPT_PAYABLE';
  direction: 'INFLOW' | 'OUTFLOW';
  sourceId: string;
  salesContractId: string | null;
  salesContractVersionNumber: number | null;
  purchaseContractId: string | null;
  purchaseContractVersionNumber: number | null;
  loadId: string | null;
  loadReceiptId: string | null;
  contractReference: string | null;
  counterpartyId: string | null;
  counterpartyName: string | null;
  authorityId: string | null;
  authorityName: string | null;
  beneficiaryType: 'COUNTERPARTY' | 'FISCAL_AUTHORITY';
  beneficiaryName: string;
  dispatchDocumentReference: string | null;
  dispatchedAt: string | null;
  quantityKg: string | null;
  unitPrice: string | null;
  rawAmount: string | null;
  calculatedAmount: string | null;
  calculationStatus: string;
  expectedOn: string | null;
  formulaCode: string;
  formulaVersion: number;
  calculationMemory: Record<string, unknown>;
  title: FinancialTitle | null;
};

export type FinancialSettlement = {
  id: string;
  titleId: string;
  titleNumber: string;
  amount: string;
  receivedAt: string;
  bankReference: string;
  notes: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
};

export type FinancialPayment = {
  id: string;
  titleId: string;
  fiscalObligationId: string | null;
  purchaseReceiptId: string | null;
  titleNumber: string;
  beneficiaryName: string;
  amount: string;
  paidAt: string;
  bankReference: string;
  notes: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
};

export type FinanceGovernance = {
  activePolicy: { id: string; version: number; payment_approval_threshold: string; active: boolean } | null;
  purchaseCostComponents: Array<{
    id: string; financial_event_id: string; title_id: string; title_number: string;
    component_type: string; payable_impact: string; amount: string; description: string;
    external_reference: string | null; reversed_at: string | null; reversal_reason: string | null;
  }>;
  paymentBatches: Array<{
    id: string; reference: string; scheduled_on: string; status: string; total_amount: string;
    policy_version: number | null; approval_threshold: string | null;
    items: Array<{ id: string; titleId: string; titleNumber: string; amount: string; paymentId: string | null }>;
  }>;
  bankAccounts: Array<{ id: string; code: string; name: string; active: boolean }>;
  bankStatementEntries: Array<{
    id: string; bank_account_id: string; bank_account_code: string; occurred_at: string;
    direction: 'CREDIT' | 'DEBIT'; amount: string; bank_reference: string;
    description: string | null; status: 'UNMATCHED' | 'MATCHED'; matched_type: string | null;
    matched_id: string | null;
  }>;
  realizedMargin: {
    status: 'COMPLETE' | 'NO_DATA'; revenueAmount: string; totalCostAmount: string;
    realizedMarginAmount: string;
    byCommodity: Array<{ commodity: string; revenueAmount: string; acquisitionCostAmount: string;
      componentImpactAmount: string; totalCostAmount: string; realizedMarginAmount: string; dispatchedKg: string }>;
  };
  commissionPolicies: Array<{
    id: string; code: string; name: string; version: number; status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
    basis: 'FINANCIAL_EVENT_AMOUNT'; rate_pct: string; commodity: 'MILHO' | 'SOJA' | null;
    beneficiary_name: string; effective_from: string; effective_to: string | null; created_at: string;
  }>;
  commissionAccruals: Array<{
    id: string; policy_id: string; policy_code: string; financial_event_id: string;
    basis_amount: string; commission_amount: string; status: 'ACCRUED' | 'REVERSED';
    calculation_snapshot: Record<string, unknown>; created_at: string;
  }>;
};

export type FinanceWorkspace = {
  tenant: { legalName: string; isDemo: boolean; demoSeedVersion: number | null };
  summary: {
    projectedAmount: string;
    receivableAmount: string;
    receivedAmount: string;
    paidAmount: string;
    netCashFlowAmount: string;
    payableAmount: string;
    pendingForecastCount: number;
    pendingRoundingCount: number;
  };
  events: FinancialEvent[];
  settlements: FinancialSettlement[];
  payments: FinancialPayment[];
  governance: FinanceGovernance;
};

export type FinanceResult =
  | { data: FinanceWorkspace; error: null }
  | { data: null; error: string };

export async function loadFinance(identityHeaders: Record<string, string>): Promise<FinanceResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/finance`, {
      headers: identityHeaders,
      cache: 'no-store',
    });
    if (!response.ok) return { data: null, error: 'A API não conseguiu carregar o financeiro.' };
    return { data: await response.json() as FinanceWorkspace, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}

export function formatMoney(value: string | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatFinancialDate(value: string): string {
  const normalized = value.length === 10 ? `${value}T12:00:00-03:00` : value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
  }).format(new Date(normalized));
}

export function titleStatusLabel(value: string): string {
  if (value === 'OPEN') return 'Em aberto';
  if (value === 'PARTIALLY_SETTLED') return 'Recebido parcialmente';
  if (value === 'SETTLED') return 'Liquidado';
  return value;
}

export function payableStatusLabel(value: string): string {
  if (value === 'OPEN') return 'Em aberto';
  if (value === 'PARTIALLY_SETTLED') return 'Pago parcialmente';
  if (value === 'SETTLED') return 'Pago';
  return value;
}
