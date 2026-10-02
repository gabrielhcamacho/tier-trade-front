export type RiskLimit = {
  id: string | null;
  version: number | null;
  maxNetOpenKg: string | null;
  warningThresholdPct: string | null;
  usagePct: string | null;
  status: 'UNCONFIGURED' | 'WITHIN_LIMIT' | 'WARNING' | 'EXCEEDED';
};

export type RiskPosition = {
  commodity: string;
  physical: {
    purchaseContractedKg: string; salesContractedKg: string; netContractualKg: string;
    physicalStockKg: string; committedStockKg: string; availableStockKg: string;
    dispatchedKg: string; fulfillmentCoveragePct: string;
  };
  financial: {
    purchaseCommitmentAmount: string; salesCommitmentAmount: string; netContractedAmount: string;
    projectedReceivableAmount: string; outstandingReceivableAmount: string; receivedAmount: string;
  };
  limit: RiskLimit;
};

export type RiskWorkspace = {
  tenant: { legalName: string; isDemo: boolean; demoSeedVersion: number | null };
  calculatedAt: string;
  positions: RiskPosition[];
  marketRisk: {
    status: 'BLOCKED_CONFIGURATION'; unavailableMetrics: string[]; blockers: string[];
  };
};

export type RiskResult = { data: RiskWorkspace; error: null } | { data: null; error: string };

export async function loadRisk(identityHeaders: Record<string, string>): Promise<RiskResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/risk`, { headers: identityHeaders, cache: 'no-store' });
    if (!response.ok) return { data: null, error: 'A API não conseguiu consolidar a posição de risco.' };
    return { data: await response.json() as RiskWorkspace, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}

export function formatWeight(value: string): string {
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    .format(Number(value) / 1000)} t`;
}

export function formatRiskMoney(value: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(value));
}
