export type CommercialDemand = {
  id: string;
  counterparty_id: string;
  counterparty_name: string;
  direction: 'PURCHASE' | 'SALE';
  commodity: 'MILHO' | 'SOJA';
  unit: 'SC_60KG';
  quantity_sc: string;
  delivery_start: string;
  delivery_end: string;
  indicative_price_per_sc: string | null;
  description: string | null;
  status: 'OPEN' | 'CLOSED';
  version: number;
  created_at: string;
  updated_at: string;
  close_reason: string | null;
  negotiation_count?: number;
};

export type CommercialCounterparty = {
  id: string; legal_name: string; party_type: 'UNCLASSIFIED' | 'PERSON' | 'COMPANY' | 'COOPERATIVE';
};
export type NegotiationEntry = {
  id: string;
  note: string;
  indicative_price_per_sc: string | null;
  created_by: string;
  created_at: string;
};

async function getApi<T>(path: string, identityHeaders: Record<string, string>): Promise<{
  data: T | null; error: string | null;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}${path}`, { headers: identityHeaders, cache: 'no-store' });
    if (!response.ok) return { data: null, error: response.status === 404
      ? 'A demanda não existe nesta empresa.' : 'Não foi possível consultar as demandas na API.' };
    return { data: await response.json() as T, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}

export function loadDemands(identityHeaders: Record<string, string>) {
  return getApi<{ items: CommercialDemand[]; hasMore: boolean; counterparties: CommercialCounterparty[] }>(
    '/v1/commercial/demands', identityHeaders);
}

export function loadDemand(id: string, identityHeaders: Record<string, string>) {
  return getApi<{ demand: CommercialDemand; negotiations: NegotiationEntry[] }>(
    `/v1/commercial/demands/${encodeURIComponent(id)}`, identityHeaders);
}
