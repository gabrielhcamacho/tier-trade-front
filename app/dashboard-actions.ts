'use server';

import { revalidatePath } from 'next/cache';
import { currentUserContext } from '../lib/current-user';
import { dashboardModules, type DashboardModule } from '../lib/dashboard';

export async function refreshDashboard(formData: FormData): Promise<void> {
  const requested = String(formData.get('module') ?? '');
  if (!dashboardModules.includes(requested as DashboardModule)) return;
  const paths: Record<DashboardModule, string> = {
    central: '/central', commercial: '/comercial', contracts: '/contratos/visao-geral', operations: '/operacoes',
    inventory: '/estoque/visao-geral', risk: '/risco/visao-geral', financial: '/financeiro/visao-geral', fiscal: '/fiscal/visao-geral',
  };
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const user = await currentUserContext();
  if (!apiUrl || Object.keys(user.identityHeaders).length === 0) return;
  await fetch(`${apiUrl}/v1/dashboards/${requested}/refresh`, { method: 'POST', headers: user.identityHeaders, cache: 'no-store' });
  revalidatePath(paths[requested as DashboardModule]);
}
