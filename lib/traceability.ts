import { loadContracts } from './contracts';
import { loadFinance } from './finance';
import { loadFiscal } from './fiscal';
import { loadInventory } from './inventory';
import { loadOffers } from './offers';

export type TraceabilityPurchase = {
  contractId: string;
  externalNumber: string | null;
  counterpartyName: string;
  commodity: string;
  offerId: string | null;
  loadIds: string[];
  fiscalDocumentNumbers: string[];
  lotCodes: string[];
  movementCount: number;
  financialTitleNumbers: string[];
  statuses: { contract: string; fiscal: string[]; financial: string[] };
};

export type TraceabilitySale = {
  contractId: string;
  reference: string;
  counterpartyName: string;
  commodity: string;
  dispatchIds: string[];
  fiscalDocumentNumbers: string[];
  financialTitleNumbers: string[];
  settlementCount: number;
  statuses: { contract: string; fiscal: string[]; financial: string[] };
};

export type TraceabilityWorkspace = {
  tenantName: string;
  isDemo: boolean;
  purchases: TraceabilityPurchase[];
  sales: TraceabilitySale[];
  totals: { offers: number; contracts: number; loads: number; documents: number; lots: number; financialEvents: number };
};

export async function loadTraceability(identityHeaders: Record<string, string>): Promise<{ data: TraceabilityWorkspace | null; error: string | null }> {
  const [offers, contracts, inventory, fiscal, finance] = await Promise.all([
    loadOffers(identityHeaders), loadContracts(identityHeaders), loadInventory(identityHeaders), loadFiscal(identityHeaders), loadFinance(identityHeaders),
  ]);
  const error = offers.error ?? contracts.error ?? inventory.error ?? fiscal.error ?? finance.error;
  if (error || !offers.data || !contracts.portfolio || !inventory.data || !fiscal.data || !finance.data) {
    return { data: null, error: error ?? 'Não foi possível consolidar a rastreabilidade.' };
  }

  const purchases = contracts.portfolio.items.map((contract) => {
    const offer = offers.data!.items.find((item) => item.contract_id === contract.id);
    const lots = inventory.data!.lots.filter((item) => item.contractId === contract.id);
    const purchaseDocuments = fiscal.data!.purchaseDocuments.filter((item) => item.purchaseContractId === contract.id);
    const events = finance.data!.events.filter((item) => item.purchaseContractId === contract.id);
    const loadIds = unique([...lots.map((item) => item.sourceLoadId), ...purchaseDocuments.map((item) => item.loadId), ...events.map((item) => item.loadId)]);
    const lotIds = new Set(lots.map((item) => item.id));
    return {
      contractId: contract.id,
      externalNumber: contract.external_number,
      counterpartyName: contract.counterparty_name,
      commodity: contract.commodity,
      offerId: offer?.id ?? null,
      loadIds,
      fiscalDocumentNumbers: purchaseDocuments.map((item) => item.documentNumber),
      lotCodes: lots.map((item) => item.lotCode),
      movementCount: inventory.data!.movements.filter((item) => lotIds.has(item.lotId)).length,
      financialTitleNumbers: unique(events.map((item) => item.title?.number)),
      statuses: { contract: contract.status, fiscal: unique(purchaseDocuments.map((item) => item.status)), financial: unique(events.map((item) => item.title?.status)) },
    } satisfies TraceabilityPurchase;
  });

  const sales = inventory.data.salesContracts.map((contract) => {
    const dispatches = inventory.data!.dispatches.filter((item) => item.contract_reference === contract.reference);
    const documents = fiscal.data!.documents.filter((item) => item.salesContractId === contract.id);
    const events = finance.data!.events.filter((item) => item.salesContractId === contract.id);
    const titleIds = new Set(events.flatMap((item) => item.title ? [item.title.id] : []));
    return {
      contractId: contract.id,
      reference: contract.reference,
      counterpartyName: contract.counterparty_name,
      commodity: contract.commodity,
      dispatchIds: dispatches.map((item) => item.id),
      fiscalDocumentNumbers: documents.map((item) => item.documentNumber),
      financialTitleNumbers: unique(events.map((item) => item.title?.number)),
      settlementCount: finance.data!.settlements.filter((item) => titleIds.has(item.titleId)).length,
      statuses: { contract: contract.status, fiscal: unique(documents.map((item) => item.status)), financial: unique(events.map((item) => item.title?.status)) },
    } satisfies TraceabilitySale;
  });

  return { data: {
    tenantName: contracts.portfolio.tenant.legalName,
    isDemo: contracts.portfolio.tenant.isDemo,
    purchases,
    sales,
    totals: {
      offers: offers.data.items.length,
      contracts: contracts.portfolio.items.length + inventory.data.salesContracts.length,
      loads: unique([...inventory.data.lots.map((item) => item.sourceLoadId), ...fiscal.data.purchaseDocuments.map((item) => item.loadId)]).length,
      documents: fiscal.data.documents.length + fiscal.data.purchaseDocuments.length,
      lots: inventory.data.lots.length,
      financialEvents: finance.data.events.length,
    },
  }, error: null };
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
