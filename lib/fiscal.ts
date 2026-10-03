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
  ratePct: string | null;
  retained: boolean;
};

export type FiscalConfiguration = {
  id: string; configurationKey: string; version: number; establishmentId: string | null;
  establishmentName: string | null; establishmentUf: string | null; taxRegime: string | null;
  name: string; operationType: 'SALE_DISPATCH'; commodity: string | null;
  destinationUf: string | null; cfop: string | null; emissionStrategy: 'NATIVE' | 'INTEGRATED' | null;
  technicalResponsible: string | null; effectiveFrom: string | null; effectiveTo: string | null;
  taxComponents: FiscalTaxComponent[]; status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  updatedAt: string; activatedAt: string | null;
};

export type FiscalWorkspace = {
  tenant: { legalName: string; isDemo: boolean; demoSeedVersion: number | null };
  summary: { received: number; validated: number; rejected: number; linkedTitles: number };
  documents: FiscalDocument[];
  establishments: FiscalEstablishment[];
  configurations: FiscalConfiguration[];
  eligibleEvents: Array<{
    id: string; sourceId: string; salesContractId: string; contractReference: string;
    counterpartyName: string; dispatchReference: string; expectedAmount: string | null;
    calculationStatus: string;
  }>;
  taxCalculation: {
    status: 'BLOCKED_CONFIGURATION' | 'BLOCKED_ENGINE'; activeConfigurationCount: number; blockers: string[];
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
