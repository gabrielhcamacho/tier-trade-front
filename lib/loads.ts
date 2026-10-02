export type ScheduledLoad = {
  id: string;
  contractId: string;
  scheduledAt: string;
  timezone: string;
  expectedWeightKg: string;
  vehiclePlate: string;
  carrierName: string;
  destinationCode: string;
  status: string;
  createdAt: string;
};

export type LoadReceipt = {
  id: string;
  version: number;
  receivedAt: string;
  grossWeightKg: string;
  tareWeightKg: string;
  netWeightKg: string;
  weighingMode: 'SCALE' | 'MANUAL_CONTINGENCY';
  scaleTicketNumber: string | null;
  contingencyReason: string | null;
  moisturePct: string;
  impurityPct: string;
  damagedPct: string;
  qualityDecision: 'ACCEPTED' | 'REVIEW_REQUIRED';
  notes: string | null;
  createdAt: string;
};

export type LoadEvent = {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type LoadDetail = ScheduledLoad & {
  receipt: LoadReceipt | null;
  receiptHistory: LoadReceipt[];
  events: LoadEvent[];
};

export type LoadAgenda = {
  items: ScheduledLoad[];
  summary: {
    count: number;
    scheduledWeightKg: string;
    receivedWeightKg: string;
    availableWeightKg: string;
  };
};

export type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

export async function loadContractLoads(
  contractId: string,
  identityHeaders: Record<string, string>,
): Promise<ApiResult<LoadAgenda>> {
  return fetchOperational(`/v1/contracts/${encodeURIComponent(contractId)}/loads`, identityHeaders);
}

export async function loadLoadDetail(
  loadId: string,
  identityHeaders: Record<string, string>,
): Promise<ApiResult<LoadDetail>> {
  return fetchOperational(`/v1/loads/${encodeURIComponent(loadId)}`, identityHeaders);
}

async function fetchOperational<T>(
  path: string,
  identityHeaders: Record<string, string>,
): Promise<ApiResult<T>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}${path}`, { headers: identityHeaders, cache: 'no-store' });
    if (!response.ok) {
      return {
        data: null,
        error: response.status === 404
          ? 'O registro não existe ou não pertence ao tenant autenticado.'
          : 'A API não conseguiu carregar os dados operacionais.',
      };
    }
    return { data: await response.json() as T, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API na porta configurada.' };
  }
}

export function formatWeightKg(value: string): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(value));
}

export function formatSchedule(value: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(value));
}

export function loadStatusLabel(value: string): string {
  if (value === 'SCHEDULED') return 'Programada';
  if (value === 'IN_RECEIVING') return 'Em recebimento';
  if (value === 'RECEIVED') return 'Recebida';
  if (value === 'CANCELLED') return 'Cancelada';
  return value;
}
