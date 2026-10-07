export type OfferListItem = {
  id: string; status: string; commodity: string; unit: string; quantity_sc: string;
  delivery_start: string; delivery_end: string; created_at: string;
  counterparty_name: string; purchase_price_per_sc: string; projected_margin_per_sc: string;
  scenario_version: number; policy_version: number; approval_status: string | null; contract_id: string | null;
};

export type OfferPortfolio = {
  tenant: { legalName: string; isDemo: boolean };
  items: OfferListItem[];
};

export async function loadOffers(identityHeaders: Record<string, string>): Promise<{
  data: OfferPortfolio | null; error: string | null;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/offers`, { headers: identityHeaders, cache: 'no-store' });
    if (!response.ok) return { data: null, error: 'A API não conseguiu carregar as ofertas.' };
    return { data: await response.json() as OfferPortfolio, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}
