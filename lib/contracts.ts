export type ContractObligation = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  due_date: string | null;
  responsible_name: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  evidence: Array<{
    documentId: string;
    fileName: string;
    documentType: string;
    status: string;
    linkedAt: string;
  }>;
};

export type OpenContractObligation = Pick<ContractObligation,
  'id' | 'code' | 'title' | 'description' | 'due_date' | 'responsible_name' | 'status'> & {
    contract_id: string;
    counterparty_name: string;
    commodity: string;
  };

export async function loadOpenContractObligations(identityHeaders: Record<string, string>): Promise<{
  items: OpenContractObligation[]; hasMore: boolean; error: string | null;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { items: [], hasMore: false, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/contracts/obligations/open`, {
      headers: identityHeaders, cache: 'no-store',
    });
    if (!response.ok) return { items: [], hasMore: false, error: 'A API não conseguiu carregar as obrigações abertas.' };
    return { ...(await response.json() as { items: OpenContractObligation[]; hasMore: boolean }), error: null };
  } catch {
    return { items: [], hasMore: false, error: 'Não foi possível acessar as obrigações na API.' };
  }
}

export type ContractSummary = {
  id: string;
  status: string;
  commodity: string;
  unit: string;
  quantity_sc: string;
  delivery_start: string;
  delivery_end: string;
  purchase_price_per_sc: string;
  sale_reference_per_sc: string;
  total_costs_per_sc: string;
  projected_margin_per_sc: string;
  policy_version: number;
  load_count: number;
  obligations: ContractObligation[];
  purchase_terms: PurchaseContractTerms | null;
};

export type PurchaseContractTerms = {
  externalNumber: string;
  cropYear: string;
  signedOn: string | null;
  pickupLocation: string | null;
  deliveryCondition: string | null;
  freightPayer: 'BUYER' | 'SELLER' | 'THIRD_PARTY' | null;
  weighingResponsibility: string | null;
  qualityTerms: string | null;
  requiredDocuments: string | null;
  paymentTerms: string | null;
  version: number;
  updatedAt: string;
};

export type ContractSummaryResult =
  | { summary: ContractSummary; error: null }
  | { summary: null; error: string };

export type ContractVersion = {
  version_number: number;
  lifecycle_status: string;
  change_type: 'CREATED' | 'TERMS_UPDATED' | 'STATUS_TRANSITION' | 'AMENDMENT';
  reason: string | null;
  terms: Record<string, unknown>;
  recorded_by: string;
  recorded_at: string;
  amendment_id: string | null;
  effective_on: string | null;
};

export type ContractVersionsResult =
  | { versions: ContractVersion[]; error: null }
  | { versions: []; error: string };

export type ContractListItem = {
  id: string;
  status: string;
  activated_at: string;
  counterparty_name: string;
  commodity: string;
  unit: string;
  quantity_sc: string;
  delivery_start: string;
  delivery_end: string;
  purchase_price_per_sc: string;
  total_costs_per_sc: string;
  projected_margin_per_sc: string;
  external_number: string | null;
  contract_version_number: number;
  load_count: number;
  open_load_count: number;
  received_load_count: number;
  scheduled_weight_kg: string;
  received_weight_kg: string;
  available_weight_kg: string;
  pending_obligations: number;
  amendment_count: number;
  latest_amendment_on: string | null;
  document_count: number;
  guarantee_count: number;
  signed_contract_count: number;
  pending_signature_count: number;
  signed_signature_count: number;
};

export type ContractPortfolio = {
  tenant: {
    legalName: string;
    isDemo: boolean;
    demoSeedVersion: number | null;
  };
  items: ContractListItem[];
};

export type ContractPortfolioResult =
  | { portfolio: ContractPortfolio; error: null }
  | { portfolio: null; error: string };

export async function loadContracts(
  identityHeaders: Record<string, string>,
): Promise<ContractPortfolioResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { portfolio: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }

  try {
    const response = await fetch(`${apiUrl}/v1/contracts`, {
      headers: identityHeaders,
      cache: 'no-store',
    });
    if (!response.ok) {
      return { portfolio: null, error: 'A API não conseguiu carregar a carteira de contratos.' };
    }
    return { portfolio: await response.json() as ContractPortfolio, error: null };
  } catch {
    return { portfolio: null, error: 'Não foi possível acessar a API na porta configurada.' };
  }
}

export async function loadContractSummary(
  contractId: string,
  identityHeaders: Record<string, string>,
): Promise<ContractSummaryResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { summary: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }

  try {
    const response = await fetch(`${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/summary`, {
      headers: identityHeaders,
      cache: 'no-store',
    });
    if (!response.ok) {
      return {
        summary: null,
        error: response.status === 404
          ? 'O contrato não existe ou não pertence ao tenant autenticado.'
          : 'A API não conseguiu carregar o resumo do contrato.',
      };
    }
    return { summary: await response.json() as ContractSummary, error: null };
  } catch {
    return { summary: null, error: 'Não foi possível acessar a API na porta configurada.' };
  }
}

export async function loadContractVersions(
  contractId: string,
  identityHeaders: Record<string, string>,
): Promise<ContractVersionsResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { versions: [], error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }

  try {
    const response = await fetch(`${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/versions`, {
      headers: identityHeaders,
      cache: 'no-store',
    });
    if (!response.ok) {
      return { versions: [], error: 'A API não conseguiu carregar o histórico do contrato.' };
    }
    const result = await response.json() as { versions: ContractVersion[] };
    return { versions: result.versions, error: null };
  } catch {
    return { versions: [], error: 'Não foi possível acessar o histórico na API.' };
  }
}

export function formatQuantity(value: string): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value));
}

export function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function daysBetween(start: string, end: string): number {
  return Math.max(
    1,
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1,
  );
}

export function commodityLabel(value: string): string {
  return value === 'MILHO' ? 'Milho' : value === 'SOJA' ? 'Soja' : value;
}

export function unitLabel(value: string): string {
  return value === 'SC_60KG' ? 'Saca de 60 kg' : value;
}

export function contractStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho', AWAITING_SIGNATURE: 'Aguardando assinatura', SIGNED: 'Assinado',
    ACTIVE: 'Ativo', CLOSED: 'Encerrado', CANCELLED: 'Cancelado',
  };
  return labels[value] ?? value;
}

export function obligationLabel(value: string): string {
  if (value === 'SIGNED_CONTRACT') return 'Contrato assinado';
  if (value === 'DELIVERY_SCHEDULE') return 'Agenda de entrega';
  return value;
}

export function obligationStatus(value?: string): string {
  if (value === 'COMPLETED') return 'Concluída';
  if (value === 'IN_PROGRESS') return 'Em andamento';
  if (value === 'CANCELLED') return 'Cancelada';
  if (value === 'PENDING') return 'Pendente';
  return 'Não registrada';
}
