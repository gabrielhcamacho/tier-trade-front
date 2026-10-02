export type FinancialTitle = {
  id: string;
  number: string;
  documentReference: string;
  dueDate: string;
  amount: string;
  status: string;
  settledAmount: string;
  outstandingAmount: string;
};

export type FinancialEvent = {
  id: string;
  sourceId: string;
  salesContractId: string;
  contractReference: string;
  counterpartyId: string;
  counterpartyName: string;
  dispatchDocumentReference: string;
  dispatchedAt: string;
  quantityKg: string;
  unitPrice: string;
  rawAmount: string;
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

export type FinanceWorkspace = {
  tenant: { legalName: string; isDemo: boolean; demoSeedVersion: number | null };
  summary: {
    projectedAmount: string;
    receivableAmount: string;
    receivedAmount: string;
    pendingForecastCount: number;
    pendingRoundingCount: number;
  };
  events: FinancialEvent[];
  settlements: FinancialSettlement[];
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
