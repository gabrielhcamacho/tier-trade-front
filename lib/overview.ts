import type { OfferPortfolio } from './offers';
import type { ContractPortfolio } from './contracts';
import type { FinanceWorkspace } from './finance';
import type { InventoryPosition } from './inventory';
import type { RiskWorkspace } from './risk';

export type OverviewResponse = {
  contractVersion: number;
  assembledAt: string;
  consistency: 'MULTI_TRANSACTION';
  tenant: { id: string; legalName: string; isDemo: boolean; timezone: string };
  filters: { commodity: string | null; financeScope: 'TENANT_CONSOLIDATED' };
  indicators: {
    projectedMarginAmount: string | null;
    projectedMarginStatus: 'READY' | 'NO_DATA' | 'PENDING_ROUNDING_POLICY';
    purchaseContractedKg: string;
    purchaseReceivedKg: string;
    salesContractedKg: string;
    salesDispatchedKg: string;
    receivedAmount: string;
    paidAmount: string;
    netCashFlowAmount: string;
    receivableAmount: string;
    payableAmount: string;
    pendingApprovalCount: number;
    pendingObligationCount: number;
    openOccurrenceCount: number;
    criticalOccurrenceCount: number;
    qualityReviewCount: number;
    fiscalPendingCount: number;
    fiscalRejectedCount: number;
    purchasePayableOpenCount: number;
  };
  operational: {
    openOccurrences: number; criticalOccurrences: number; qualityReviews: number;
    fiscalPending: number; fiscalRejected: number; purchasePayablesOpen: number;
  };
  charts: {
    marginComponents: Array<{ contractId: string; counterpartyName: string; commodity: string;
      policyVersion: number | null; quantitySc: string; marginPerSc: string; amount: string | null;
      calculationStatus: string }>;
    dueDates: Array<{ date: string; inflowAmount: string | null; outflowAmount: string | null;
      netKnownAmount: string | null; titleIds: string[] }>;
    byCommodity: Array<{ commodity: string; purchaseContractedKg: string; purchaseReceivedKg: string;
      salesContractedKg: string; salesDispatchedKg: string }>;
  };
  sources: { offers: OfferPortfolio; contracts: ContractPortfolio; finance: FinanceWorkspace;
    inventory: InventoryPosition; risk: RiskWorkspace };
};

export async function loadOverview(identityHeaders: Record<string, string>, commodity: string): Promise<{
  data: OverviewResponse | null; error: string | null;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const query = commodity === 'ALL' ? '' : `?commodity=${encodeURIComponent(commodity)}`;
    const response = await fetch(`${apiUrl}/v1/overview${query}`, { headers: identityHeaders, cache: 'no-store' });
    if (!response.ok) return { data: null, error: 'A API não conseguiu carregar a visão consolidada.' };
    const data = await response.json() as OverviewResponse;
    if (data.contractVersion !== 1) return { data: null, error: 'Versão da visão consolidada incompatível.' };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}
