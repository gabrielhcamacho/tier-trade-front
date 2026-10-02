export type ContractObligation = {
  code: string;
  status: string;
};

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
};

export type ContractSummaryResult =
  | { summary: ContractSummary; error: null }
  | { summary: null; error: string };

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
  projected_margin_per_sc: string;
  load_count: number;
  scheduled_weight_kg: string;
  received_weight_kg: string;
  available_weight_kg: string;
  pending_obligations: number;
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
  return value === 'MILHO' ? 'Milho' : value;
}

export function unitLabel(value: string): string {
  return value === 'SC_60KG' ? 'Saca de 60 kg' : value;
}

export function contractStatusLabel(value: string): string {
  return value === 'ACTIVE' ? 'Ativo' : value;
}

export function obligationLabel(value: string): string {
  if (value === 'SIGNED_CONTRACT') return 'Contrato assinado';
  if (value === 'DELIVERY_SCHEDULE') return 'Agenda de entrega';
  return value;
}

export function obligationStatus(value?: string): string {
  if (value === 'COMPLETED') return 'Concluída';
  if (value === 'PENDING') return 'Pendente';
  return 'Não registrada';
}
