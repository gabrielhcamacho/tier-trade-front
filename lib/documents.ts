export type DocumentAggregateType =
  | 'CONTRACT'
  | 'SALES_CONTRACT'
  | 'LOAD'
  | 'FISCAL_DOCUMENT'
  | 'COUNTERPARTY'
  | 'INVENTORY_LOT';

export type DocumentType =
  | 'CONTRACT_DRAFT'
  | 'SIGNED_CONTRACT'
  | 'AMENDMENT'
  | 'GUARANTEE'
  | 'INVOICE'
  | 'ROMANEIO'
  | 'QUALITY_REPORT'
  | 'WEIGHING_TICKET'
  | 'OTHER';

export type StoredDocument = {
  id: string;
  aggregate_type: DocumentAggregateType;
  aggregate_id: string;
  document_type: DocumentType;
  file_name: string;
  mime_type: string;
  size_bytes: string;
  status: 'PENDING_UPLOAD' | 'AVAILABLE' | 'ARCHIVED';
  version: number;
  notes: string | null;
  uploaded_at: string | null;
  created_at: string;
  signatures: Array<{
    id: string;
    provider: 'MANUAL' | 'DOCUSIGN' | 'OTHER';
    externalEnvelopeId: string | null;
    signerName: string;
    signerEmail: string | null;
    signerRole: string;
    status: 'PENDING' | 'SENT' | 'SIGNED' | 'DECLINED' | 'CANCELLED';
    sentAt: string | null;
    signedAt: string | null;
  }>;
};

export type DocumentsResult =
  | { items: StoredDocument[]; error: null }
  | { items: []; error: string };

export type DocumentArchiveFilters = {
  aggregateType?: DocumentAggregateType;
  documentType?: DocumentType;
  status?: StoredDocument['status'];
  from?: string;
  to?: string;
  criterion?: string;
  page: number;
};

export type DocumentArchiveResult = {
  items: StoredDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
};

export async function loadDocumentArchive(
  identityHeaders: Record<string, string>, filters: DocumentArchiveFilters,
): Promise<DocumentArchiveResult> {
  const fallback = (message: string): DocumentArchiveResult => ({
    items: [], total: 0, page: filters.page, pageSize: 25, totalPages: 1, error: message,
  });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return fallback('A API ou a identidade do ambiente ainda não está configurada.');
  }
  const query = new URLSearchParams({ page: String(filters.page) });
  if (filters.aggregateType) query.set('aggregateType', filters.aggregateType);
  if (filters.documentType) query.set('documentType', filters.documentType);
  if (filters.status) query.set('status', filters.status);
  if (filters.from) query.set('from', filters.from);
  if (filters.to) query.set('to', filters.to);
  if (filters.criterion) query.set('criterion', filters.criterion);
  try {
    const response = await fetch(`${apiUrl}/v1/documents/archive?${query}`, {
      headers: identityHeaders, cache: 'no-store',
    });
    if (!response.ok) return fallback('Não foi possível carregar o arquivo de documentos.');
    const body = await response.json() as Omit<DocumentArchiveResult, 'error'>;
    return { ...body, error: null };
  } catch {
    return fallback('Não foi possível acessar o arquivo de documentos.');
  }
}

export async function loadDocuments(
  identityHeaders: Record<string, string>,
  aggregateType?: DocumentAggregateType,
  aggregateId?: string,
): Promise<DocumentsResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { items: [], error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  const query = new URLSearchParams();
  if (aggregateType) query.set('aggregateType', aggregateType);
  if (aggregateId) query.set('aggregateId', aggregateId);
  try {
    const response = await fetch(`${apiUrl}/v1/documents?${query}`, {
      headers: identityHeaders,
      cache: 'no-store',
    });
    if (!response.ok) return { items: [], error: 'Não foi possível carregar os documentos vinculados.' };
    const body = await response.json() as { items: StoredDocument[] };
    return { items: body.items, error: null };
  } catch {
    return { items: [], error: 'Não foi possível acessar o armazenamento de documentos.' };
  }
}

export function documentTypeLabel(value: DocumentType): string {
  return ({
    CONTRACT_DRAFT: 'Minuta', SIGNED_CONTRACT: 'Contrato assinado', AMENDMENT: 'Aditivo',
    GUARANTEE: 'Garantia', INVOICE: 'Nota fiscal', ROMANEIO: 'Romaneio',
    QUALITY_REPORT: 'Laudo de qualidade', WEIGHING_TICKET: 'Ticket de pesagem', OTHER: 'Outro',
  })[value];
}

export function formatDocumentSize(value: string): string {
  const bytes = Number(value);
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`;
}
