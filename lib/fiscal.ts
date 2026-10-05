export type FiscalDocument = {
  id: string;
  financialEventId: string;
  sourceId: string;
  salesContractId: string;
  contractReference: string;
  counterpartyName: string;
  dispatchReference: string;
  documentType: 'NFE';
  direction: 'OUTBOUND';
  documentNumber: string;
  accessKey: string | null;
  issuedAt: string;
  totalAmount: string;
  expectedAmount: string | null;
  differenceAmount: string | null;
  status: 'RECEIVED' | 'VALIDATED' | 'REJECTED';
  validationNotes: string | null;
  rejectionReason: string | null;
  updatedAt: string;
  validatedAt: string | null;
  title: { id: string; number: string; status: string } | null;
};

export type FiscalEstablishment = {
  id: string; legalName: string; taxId: string; stateRegistration: string | null;
  uf: string; taxRegime: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | null;
  active: boolean; updatedAt: string;
};

export type FiscalTaxComponent = {
  tax: 'ICMS' | 'PIS' | 'COFINS' | 'FUNRURAL';
  treatment: 'TAXED' | 'EXEMPT' | 'NON_TAXED' | 'DEFERRED' | 'SUSPENDED';
  basis: 'DOCUMENT_TOTAL' | null;
  ratePct: string | null;
  retained: boolean;
};

export type FiscalConfiguration = {
  id: string; configurationKey: string; version: number; establishmentId: string | null;
  establishmentName: string | null; establishmentUf: string | null; taxRegime: string | null;
  name: string; operationType: 'SALE_DISPATCH' | 'PURCHASE_RECEIPT'; commodity: string | null;
  destinationUf: string | null; cfop: string | null; emissionStrategy: 'NATIVE' | 'INTEGRATED' | null;
  technicalResponsible: string | null; effectiveFrom: string | null; effectiveTo: string | null;
  roundingMode: 'HALF_UP' | 'HALF_EVEN' | 'DOWN' | 'UP' | null; roundingScale: number | null;
  taxComponents: FiscalTaxComponent[]; status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  updatedAt: string; activatedAt: string | null;
};

export type FiscalCalculation = {
  id: string; requestKey: string;
  status: 'CALCULATED' | 'ACCEPTED';
  configuration: { id: string; key: string; version: number; name: string };
  establishment: { id: string; name: string };
  context: {
    establishmentId: string; operationType: 'SALE_DISPATCH' | 'PURCHASE_RECEIPT'; commodity: string;
    destinationUf: string; occurredOn: string; grossAmount: string; currency: 'BRL';
    sourceType: 'MANUAL' | 'FISCAL_DOCUMENT' | 'FINANCIAL_EVENT'; sourceId: string | null;
  };
  result: {
    grossAmount: string; taxTotal: string; retainedTotal: string; netAmount: string;
    rounding: { mode: NonNullable<FiscalConfiguration['roundingMode']>; scale: number };
    components: Array<FiscalTaxComponent & {
      taxableBase: string; unroundedAmount: string; amount: string; explanation: string;
    }>;
  };
  calculatedAt: string;
};

export type FiscalAuthority = {
  id: string; legalName: string; taxId: string | null;
  jurisdiction: 'FEDERAL' | 'STATE' | 'MUNICIPAL'; uf: string | null; active: boolean;
};

export type FiscalObligation = {
  id: string; calculationId: string; tax: FiscalTaxComponent['tax']; amount: string;
  competenceDate: string; dueDate: string; retained: boolean;
  titleEffect: 'NONE' | 'REDUCE_SOURCE_TITLE';
  paymentResponsibility: 'TENANT' | 'COUNTERPARTY';
  status: 'OPEN' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'CANCELLED';
  authority: { id: string; name: string };
  payable: {
    eventId: string; titleId: string; titleNumber: string; amount: string;
    paidAmount: string; outstandingAmount: string; status: string;
  } | null;
  titleAdjustment: { id: string; titleId: string } | null;
};

export type FiscalWorkspace = {
  tenant: { legalName: string; isDemo: boolean; demoSeedVersion: number | null };
  summary: {
    received: number; validated: number; rejected: number; linkedTitles: number;
    openObligations: number; taxPayables: number;
  };
  documents: FiscalDocument[];
  purchaseDocuments: Array<{
    id: string; financialEventId: string; purchaseContractId: string; loadId: string;
    loadReceiptId: string; counterpartyName: string; commodity: string; documentNumber: string;
    invoiceSeries: string | null; accessKey: string | null; issuedAt: string; totalAmount: string;
    expectedAmount: string | null; differenceAmount: string | null; dueDate: string;
    titleNumber: string; scaleTicketNumber: string | null; acceptedWeightKg: string;
    status: 'RECEIVED' | 'VALIDATED' | 'REJECTED'; validationNotes: string | null;
    rejectionReason: string | null; updatedAt: string; validatedAt: string | null;
    payable: { id: string; status: string; paidAmount: string; outstandingAmount: string } | null;
  }>;
  eligiblePurchaseReceipts: Array<{
    id: string; loadId: string; contractId: string; counterpartyName: string; commodity: string;
    invoiceNumber: string; invoiceSeries: string | null; accessKey: string | null;
    acceptedWeightKg: string; purchasePricePerSc: string; receivedAt: string;
  }>;
  establishments: FiscalEstablishment[];
  configurations: FiscalConfiguration[];
  calculations: FiscalCalculation[];
  authorities: FiscalAuthority[];
  obligations: FiscalObligation[];
  calculationSources: Array<{
    id: string; eventType: 'SALE_DISPATCH_RECEIVABLE' | 'PURCHASE_RECEIPT_PAYABLE';
    reference: string; beneficiaryName: string; amount: string;
  }>;
  eligibleEvents: Array<{
    id: string; sourceId: string; salesContractId: string; contractReference: string;
    counterpartyName: string; dispatchReference: string; expectedAmount: string | null;
    calculationStatus: string;
  }>;
  taxCalculation: {
    status: 'BLOCKED_CONFIGURATION' | 'READY'; activeConfigurationCount: number; blockers: string[];
  };
};

export type FiscalResult = { data: FiscalWorkspace; error: null } | { data: null; error: string };

export async function loadFiscal(identityHeaders: Record<string, string>): Promise<FiscalResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/fiscal`, { headers: identityHeaders, cache: 'no-store' });
    if (!response.ok) return { data: null, error: 'A API não conseguiu carregar os documentos fiscais.' };
    return { data: await response.json() as FiscalWorkspace, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}

export function formatFiscalMoney(value: string | null): string {
  if (value === null) return 'Política financeira pendente';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatFiscalDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}
