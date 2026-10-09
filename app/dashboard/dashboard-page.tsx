import Link from 'next/link';
import { AppShell } from '../app-shell';
import { refreshDashboard } from '../dashboard-actions';
import { PageFeedback } from '../page-state';
import { currentUserContext } from '../../lib/current-user';
import { loadDashboard, type DashboardModule, type DashboardResponse } from '../../lib/dashboard';
import { ChartTips } from './chart-tips';
import styles from './dashboard.module.css';
import { clockTime } from './format';
import { KpiStrip } from './ui';
import { centralView } from './views/central';
import { commercialView } from './views/commercial';
import { contractsView } from './views/contracts';
import { financialView } from './views/financial';
import { fiscalView } from './views/fiscal';
import { inventoryView } from './views/inventory';
import { operationsView } from './views/operations';
import { riskView } from './views/risk';
import type { ViewInput, ViewOutput } from './views/types';

type ModuleConfig = {
  title: string;
  path: string;
  workspace: { href: string; label: string };
  view: (input: ViewInput) => ViewOutput;
};

const modules: Record<DashboardModule, ModuleConfig> = {
  central: { title: 'Central', path: '/central', workspace: { href: '/central/fila', label: 'Minha fila' }, view: centralView },
  commercial: { title: 'Comercial', path: '/comercial', workspace: { href: '/comercial/carteira', label: 'Abrir carteira' }, view: commercialView },
  contracts: { title: 'Contratos', path: '/contratos/visao-geral', workspace: { href: '/contratos', label: 'Abrir contratos' }, view: contractsView },
  operations: { title: 'Operações', path: '/operacoes', workspace: { href: '/cargas', label: 'Abrir agenda' }, view: operationsView },
  inventory: { title: 'Estoque', path: '/estoque/visao-geral', workspace: { href: '/estoque', label: 'Abrir posição' }, view: inventoryView },
  risk: { title: 'Risco', path: '/risco/visao-geral', workspace: { href: '/risco', label: 'Abrir exposição' }, view: riskView },
  financial: { title: 'Financeiro', path: '/financeiro/visao-geral', workspace: { href: '/financeiro', label: 'Abrir financeiro' }, view: financialView },
  fiscal: { title: 'Fiscal', path: '/fiscal/visao-geral', workspace: { href: '/fiscal', label: 'Abrir fiscal' }, view: fiscalView },
};

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

function todayIn(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function updatedLabel(data: DashboardResponse | null, timezone: string) {
  const generated = clockTime(data?.generatedAt, timezone);
  if (!generated) return data ? 'Calculando os indicadores' : null;
  const now = clockTime(new Date().toISOString(), timezone);
  const when = now?.date === generated.date ? `às ${generated.time}` : `em ${generated.date} às ${generated.time}`;
  return data?.freshness === 'REBUILDING' ? `Recalculando · dados de ${generated.time}` : `Atualizado ${when}`;
}

export async function ModuleDashboardPage({ module }: { module: DashboardModule }) {
  const config = modules[module];
  const user = await currentUserContext();
  const result = await loadDashboard(module, user.identityHeaders);
  const payload = result.data?.payload ?? null;
  const calendar = (payload as { calendar?: { today?: string; timezone?: string } } | null)?.calendar;
  const timezone = calendar?.timezone ?? DEFAULT_TIMEZONE;
  const view = payload ? config.view({
    indicators: payload.indicators ?? {},
    breakdowns: payload.breakdowns ?? {},
    unavailable: payload.unavailable ?? [],
    today: calendar?.today ?? todayIn(timezone),
    timezone,
  }) : null;
  const updated = updatedLabel(result.data, timezone);

  return (
    <AppShell activeDomain={module} userLabel={user.userLabel}>
      <div className={styles.page}>
        <header className={styles.head}>
          <div>
            <h1>{config.title}</h1>
            {updated ? <p>{updated}</p> : null}
          </div>
          <div className={styles.actions}>
            <form action={refreshDashboard}>
              <input type="hidden" name="module" value={module} />
              <button type="submit" className="tt-button" data-variant="secondary" data-size="sm">Atualizar</button>
            </form>
            <Link href={config.workspace.href} className="tt-button" data-variant="primary" data-size="sm">{config.workspace.label}</Link>
          </div>
        </header>
        {result.error ? (
          <PageFeedback title="Não foi possível carregar a visão geral" message={result.error} action={{ href: config.path, label: 'Tentar novamente' }} />
        ) : null}
        {!result.error && !payload ? (
          <PageFeedback tone="info" title="Os indicadores ainda estão sendo calculados" message="A primeira consolidação deste módulo leva alguns segundos. Recarregue a página em instantes." action={{ href: config.path, label: 'Recarregar' }} />
        ) : null}
        {view ? (
          <ChartTips>
            <KpiStrip items={view.kpis} />
            {view.body}
          </ChartTips>
        ) : null}
      </div>
    </AppShell>
  );
}

