import type { InventoryPosition } from './inventory';

export type SalesPortfolio = {
  items: InventoryPosition['salesContracts'];
  counterparties: InventoryPosition['counterparties'];
};

export async function loadSalesPortfolio(identityHeaders: Record<string, string>): Promise<{
  data: SalesPortfolio | null;
  error: string | null;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/inventory/sales-contracts`, {
      headers: identityHeaders, cache: 'no-store',
    });
    if (!response.ok) return { data: null, error: 'A API não conseguiu carregar as vendas.' };
    return { data: await response.json() as SalesPortfolio, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}
