export const dashboardModules = ['central', 'commercial', 'contracts', 'operations', 'inventory', 'risk', 'financial', 'fiscal'] as const;
export type DashboardModule = typeof dashboardModules[number];

export type DashboardPayload = {
  contractVersion: number;
  module: DashboardModule;
  scope?: { key: string; filters: Record<string, unknown> };
  /** Tenant-local calendar the snapshot was bucketed with. */
  calendar?: { today: string; timezone: string };
  indicators: Record<string, number | string | null>;
  breakdowns: Record<string, unknown>;
  alerts: Array<Record<string, unknown>>;
  drilldowns: Record<string, string>;
  unavailable: string[];
};

export type DashboardResponse = {
  contractVersion: number;
  module: DashboardModule;
  scopeKey: string;
  snapshotVersion: string | null;
  generatedAt: string | null;
  sourceWatermark: { eventId: string; occurredAt: string | null } | null;
  freshness: 'FRESH' | 'STALE' | 'REBUILDING';
  buildDurationMs?: number;
  payload: DashboardPayload | null;
};

export async function loadDashboard(module: DashboardModule, identityHeaders: Record<string, string>): Promise<{
  data: DashboardResponse | null;
  error: string | null;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/dashboards/${module}`, { headers: identityHeaders, cache: 'no-store' });
    if (!response.ok) return { data: null, error: 'A API não conseguiu carregar esta visão geral.' };
    const data = await response.json() as DashboardResponse;
    if (data.contractVersion !== 1 || data.module !== module) return { data: null, error: 'A versão desta visão geral é incompatível.' };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API configurada.' };
  }
}
