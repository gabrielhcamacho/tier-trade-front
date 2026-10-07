export type ScheduledLoad = {
  id: string;
  contractId: string;
  contractVersionNumber: number;
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
  arrivalWeightKg: string;
  inboundInvoiceNumber: string | null;
  inboundInvoiceSeries: string | null;
  inboundInvoiceAccessKey: string | null;
  documentWeightKg: string | null;
  consideredWeightKg: string | null;
  acceptedWeightKg: string | null;
  weightDecisionReason: string | null;
  weighingMode: 'SCALE' | 'MANUAL_CONTINGENCY';
  scaleTicketNumber: string | null;
  contingencyReason: string | null;
  moisturePct: string;
  impurityPct: string;
  damagedPct: string;
  brokenPct: string;
  burntPct: string;
  heatDamagedPct: string;
  qualityDecision: 'ACCEPTED' | 'REVIEW_REQUIRED';
  notes: string | null;
  createdAt: string;
};

export type LoadEvent = {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type YardEvent = {
  id: string;
  eventType: 'CHECKED_IN' | 'QUEUED' | 'CALLED_TO_SCALE' | 'RELEASED' | 'DEPARTED';
  locationCode: string | null;
  occurredAt: string;
  notes: string | null;
  createdAt: string;
};

export type LoadOccurrence = {
  id: string;
  category: 'DOCUMENT' | 'WEIGHT' | 'QUALITY' | 'VEHICLE' | 'YARD' | 'OTHER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  occurredAt: string;
  status: 'OPEN' | 'RESOLVED';
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Romaneio = {
  id: string;
  receiptId: string;
  reference: string;
  version: number;
  isCurrent: boolean;
  issuedAt: string;
  inboundInvoiceNumber: string;
  inboundInvoiceSeries: string;
  inboundInvoiceAccessKey: string | null;
  documentWeightKg: string;
  arrivalWeightKg: string;
  consideredWeightKg: string;
  acceptedWeightKg: string;
  scaleTicketNumber: string | null;
  moisturePct: string;
  impurityPct: string;
  damagedPct: string;
  brokenPct: string;
  burntPct: string;
  heatDamagedPct: string;
  createdAt: string;
};

export type LoadDetail = ScheduledLoad & {
  receipt: LoadReceipt | null;
  receiptHistory: LoadReceipt[];
  yardState: 'NOT_ARRIVED' | YardEvent['eventType'];
  yardEvents: YardEvent[];
  occurrences: LoadOccurrence[];
  romaneio: Romaneio | null;
  romaneioHistory: Romaneio[];
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

export type YardBoard = {
  items: Array<ScheduledLoad & {
    yardState: LoadDetail['yardState'];
    yardOccurredAt: string | null;
    yardLocationCode: string | null;
    openOccurrences: number;
  }>;
  summary: { awaitingArrival: number; inYard: number; departed: number; openOccurrences: number };
};

export type OccurrenceBoard = {
  items: Array<LoadOccurrence & {
    loadId: string;
    vehiclePlate: string;
    contractId: string;
    timezone: string;
  }>;
  summary: { open: number; critical: number; resolved: number };
};

export type OperationalBoardReceipt = {
  id: string;
  version: number;
  receivedAt: string;
  inboundInvoiceNumber: string | null;
  documentWeightKg: string | null;
  arrivalWeightKg: string | null;
  consideredWeightKg: string | null;
  acceptedWeightKg: string | null;
  scaleTicketNumber: string | null;
  moisturePct: string | null;
  impurityPct: string | null;
  damagedPct: string | null;
  brokenPct: string | null;
  burntPct: string | null;
  heatDamagedPct: string | null;
  qualityDecision: 'ACCEPTED' | 'REVIEW_REQUIRED';
};

export type OperationalBoardItem = ScheduledLoad & {
  openOccurrences: number;
  receipt: OperationalBoardReceipt | null;
};

export type ReceivingBoard = {
  items: OperationalBoardItem[];
  summary: { scheduled: number; inReceiving: number; received: number; acceptedWeightKg: string };
};

export type QualityBoard = {
  items: OperationalBoardItem[];
  summary: {
    awaitingClassification: number;
    reviewRequired: number;
    accepted: number;
    averageMoisturePct: string;
    averageImpurityPct: string;
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

export async function loadYardBoard(identityHeaders: Record<string, string>): Promise<ApiResult<YardBoard>> {
  return fetchOperational('/v1/operations/yard', identityHeaders);
}

export async function loadOccurrenceBoard(identityHeaders: Record<string, string>): Promise<ApiResult<OccurrenceBoard>> {
  return fetchOperational('/v1/operations/occurrences', identityHeaders);
}

export async function loadReceivingBoard(identityHeaders: Record<string, string>): Promise<ApiResult<ReceivingBoard>> {
  return fetchOperational('/v1/operations/receiving', identityHeaders);
}

export async function loadQualityBoard(identityHeaders: Record<string, string>): Promise<ApiResult<QualityBoard>> {
  return fetchOperational('/v1/operations/quality', identityHeaders);
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

export function formatPercent(value: string | null): string {
  return value === null ? '—' : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(Number(value))}%`;
}
