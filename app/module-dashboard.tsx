import Link from 'next/link';
import { AppShell } from './app-shell';
import { refreshDashboard } from './dashboard-actions';
import { PageFeedback } from './page-state';
import { currentUserContext } from '../lib/current-user';
import { loadDashboard, type DashboardModule, type DashboardPayload } from '../lib/dashboard';

type Indicator = { key: string; label: string; detail: string; format?: 'currency' | 'weight'; attention?: boolean };
type ModuleConfig = { domain: DashboardModule; label: string; title: string; description: string; path: string; workspace: { href: string; label: string }; indicators: Indicator[] };

const configs: Record<DashboardModule, ModuleConfig> = {
  central: { domain: 'central', label: 'Central', title: 'Visão geral', description: 'Decisões, gargalos e saúde da operação inteira em um só lugar.', path: '/central', workspace: { href: '/central/fila', label: 'Abrir minha fila' }, indicators: [
    { key: 'pendingApprovals', label: 'Aprovações pendentes', detail: 'decisões aguardando alçada', attention: true }, { key: 'activeContracts', label: 'Contratos ativos', detail: 'instrumentos em execução' }, { key: 'activeLoads', label: 'Cargas ativas', detail: 'agenda operacional corrente' }, { key: 'criticalOccurrences', label: 'Ocorrências críticas', detail: 'exigem resposta imediata', attention: true }, { key: 'openTitles', label: 'Títulos em aberto', detail: 'a receber e a pagar' }, { key: 'fiscalReviews', label: 'Revisões fiscais', detail: 'documentos em conferência', attention: true },
  ] },
  commercial: { domain: 'commercial', label: 'Comercial', title: 'Visão geral comercial', description: 'Demanda, carteira, conversão e decisões comerciais prioritárias.', path: '/comercial', workspace: { href: '/comercial/carteira', label: 'Abrir carteira' }, indicators: [
    { key: 'openDemands', label: 'Demandas abertas', detail: 'oportunidades ativas' }, { key: 'openDemandQuantitySc', label: 'Volume demandado', detail: 'sacas em oportunidades' }, { key: 'draftOffers', label: 'Ofertas em rascunho', detail: 'ainda não enviadas' }, { key: 'pendingApprovals', label: 'Aguardando aprovação', detail: 'dependem de alçada', attention: true }, { key: 'approvedOffers', label: 'Ofertas aprovadas', detail: 'prontas para avançar' }, { key: 'negotiationsLast7Days', label: 'Negociações em 7 dias', detail: 'atividade recente' },
  ] },
  contracts: { domain: 'contracts', label: 'Contratos', title: 'Visão geral de contratos', description: 'Execução, obrigações, documentos e mudanças da carteira contratual.', path: '/contratos/visao-geral', workspace: { href: '/contratos', label: 'Abrir contratos' }, indicators: [
    { key: 'activeContracts', label: 'Contratos ativos', detail: 'em execução' }, { key: 'pendingObligations', label: 'Obrigações pendentes', detail: 'ações ainda abertas', attention: true }, { key: 'overdueObligations', label: 'Obrigações vencidas', detail: 'fora do prazo', attention: true }, { key: 'obligationsDue30Days', label: 'Vencem em 30 dias', detail: 'próximos compromissos' }, { key: 'amendments', label: 'Aditivos', detail: 'alterações registradas' }, { key: 'pendingDocuments', label: 'Documentos pendentes', detail: 'formalização incompleta', attention: true },
  ] },
  operations: { domain: 'operations', label: 'Operações', title: 'Visão geral operacional', description: 'Fluxo de cargas, recebimentos, qualidade e ocorrências do dia.', path: '/operacoes', workspace: { href: '/cargas', label: 'Abrir agenda de cargas' }, indicators: [
    { key: 'scheduledLoads', label: 'Cargas programadas', detail: 'na agenda operacional' }, { key: 'loadsInReceiving', label: 'Em recebimento', detail: 'processamento em curso' }, { key: 'receivedLoads', label: 'Cargas recebidas', detail: 'execução confirmada' }, { key: 'delayedLoads', label: 'Cargas atrasadas', detail: 'fora da janela', attention: true }, { key: 'criticalOccurrences', label: 'Ocorrências críticas', detail: 'exigem ação', attention: true }, { key: 'qualityReviews', label: 'Revisões de qualidade', detail: 'aguardando decisão', attention: true },
  ] },
  inventory: { domain: 'inventory', label: 'Estoque', title: 'Visão geral de estoque', description: 'Disponibilidade física, localização, bloqueios e governança dos lotes.', path: '/estoque/visao-geral', workspace: { href: '/estoque', label: 'Abrir posição de estoque' }, indicators: [
    { key: 'physicalQuantityKg', label: 'Estoque físico', detail: 'saldo total', format: 'weight' }, { key: 'availableLots', label: 'Lotes disponíveis', detail: 'liberados para operação' }, { key: 'blockedLots', label: 'Lotes bloqueados', detail: 'exigem tratamento', attention: true }, { key: 'transfersInTransit', label: 'Transferências em trânsito', detail: 'movimentações abertas' }, { key: 'ownershipPending', label: 'Titularidade pendente', detail: 'governança incompleta', attention: true }, { key: 'riskClassificationPending', label: 'Risco pendente', detail: 'classificação incompleta', attention: true },
  ] },
  risk: { domain: 'risk', label: 'Risco', title: 'Visão geral de risco', description: 'Exposição, uso de limites e posições que pedem decisão.', path: '/risco/visao-geral', workspace: { href: '/risco', label: 'Abrir exposição' }, indicators: [
    { key: 'commodityCount', label: 'Commodities monitoradas', detail: 'posições consolidadas' }, { key: 'warningCount', label: 'Limites em atenção', detail: 'próximos do limite', attention: true }, { key: 'exceededCount', label: 'Limites excedidos', detail: 'ação imediata', attention: true }, { key: 'unconfiguredCount', label: 'Sem limite configurado', detail: 'cobertura incompleta', attention: true },
  ] },
  financial: { domain: 'financial', label: 'Financeiro', title: 'Visão geral financeira', description: 'Liquidez, vencimentos, conciliação e aprovações financeiras.', path: '/financeiro/visao-geral', workspace: { href: '/financeiro', label: 'Abrir financeiro' }, indicators: [
    { key: 'receivableAmount', label: 'Contas a receber', detail: 'saldo em aberto', format: 'currency' }, { key: 'payableAmount', label: 'Contas a pagar', detail: 'saldo em aberto', format: 'currency' }, { key: 'overdueTitles', label: 'Títulos vencidos', detail: 'fora do prazo', attention: true }, { key: 'paymentBatchesPendingApproval', label: 'Lotes em aprovação', detail: 'aguardando alçada', attention: true }, { key: 'unmatchedBankEntries', label: 'Itens não conciliados', detail: 'lançamentos sem vínculo', attention: true }, { key: 'receivedAmount', label: 'Total recebido', detail: 'caixa realizado', format: 'currency' },
  ] },
  fiscal: { domain: 'fiscal', label: 'Fiscal', title: 'Visão geral fiscal', description: 'Documentos, validações, tributos e obrigações em uma leitura rápida.', path: '/fiscal/visao-geral', workspace: { href: '/fiscal', label: 'Abrir fiscal' }, indicators: [
    { key: 'documentsPendingValidation', label: 'Aguardando validação', detail: 'documentos pendentes', attention: true }, { key: 'validatedDocuments', label: 'Documentos validados', detail: 'processamento concluído' }, { key: 'rejectedDocuments', label: 'Documentos rejeitados', detail: 'exigem correção', attention: true }, { key: 'calculationsPendingAcceptance', label: 'Cálculos pendentes', detail: 'aguardando aceite', attention: true }, { key: 'overdueObligations', label: 'Obrigações vencidas', detail: 'fora do prazo', attention: true }, { key: 'openObligationAmount', label: 'Obrigações abertas', detail: 'valor conhecido', format: 'currency' },
  ] },
};

const wholeNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function formatValue(value: unknown, format?: Indicator['format']) {
  if (value === null || value === undefined) return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  if (format === 'currency') return money.format(numeric);
  if (format === 'weight') return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(numeric / 1000)} t`;
  return wholeNumber.format(numeric);
}
function buildIssues(config: ModuleConfig, payload: DashboardPayload) {
  return config.indicators.filter((item) => item.attention && Number(payload.indicators[item.key] ?? 0) > 0).map((item) => ({ ...item, value: payload.indicators[item.key] }));
}

export async function ModuleDashboardPage({ module }: { module: DashboardModule }) {
  const config = configs[module];
  const user = await currentUserContext();
  const result = await loadDashboard(module, user.identityHeaders);
  const payload = result.data?.payload;
  const issues = payload ? buildIssues(config, payload) : [];
  const generatedAt = result.data?.generatedAt ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(result.data.generatedAt)) : 'aguardando primeira atualização';
  return <AppShell activeDomain={config.domain} userLabel={user.userLabel}><div className="module-dashboard">
    <header className="module-dashboard-head"><div><p>{config.label} <span>›</span> Visão geral</p><h1>{config.title}</h1><span>{config.description}</span></div><div className="module-dashboard-actions"><div className="dashboard-freshness" data-state={result.data?.freshness ?? 'ERROR'}><i /><span>{result.data?.freshness === 'FRESH' ? 'Atualizado' : result.data?.freshness === 'STALE' ? 'Atualização pendente' : 'Atualizando'}<small>{generatedAt}</small></span></div><form action={refreshDashboard}><input type="hidden" name="module" value={module} /><button type="submit">Atualizar</button></form><Link href={config.workspace.href}>{config.workspace.label} <span>→</span></Link></div></header>
    {result.error ? <PageFeedback title="Não foi possível carregar esta visão geral" message={result.error} action={{ href: config.path, label: 'Tentar novamente' }} /> : null}
    {!result.error && !payload ? <PageFeedback tone="info" title="Preparando a primeira visão geral" message="Os indicadores estão sendo consolidados em segundo plano. Atualize em instantes." action={{ href: config.path, label: 'Verificar novamente' }} /> : null}
    {payload ? <><section className="module-dashboard-kpis" aria-label="Indicadores principais">{config.indicators.map((item) => { const value = payload.indicators[item.key]; const active = item.attention && Number(value ?? 0) > 0; return <article key={item.key} data-attention={active || undefined}><small>{item.label}</small><strong>{formatValue(value, item.format)}</strong><span>{item.detail}</span></article>; })}</section>
      <div className="module-dashboard-grid"><section className="dashboard-priority"><header><div><p>PRIORIDADES</p><h2>Onde agir agora</h2></div><span>{issues.length} ponto(s) de atenção</span></header>{issues.length ? <div className="dashboard-issue-list">{issues.map((item, index) => <Link href={config.workspace.href} key={item.key}><b>{index + 1}</b><div><strong>{item.label}</strong><span>{item.detail}</span></div><em>{formatValue(item.value, item.format)}</em><i>→</i></Link>)}</div> : <div className="dashboard-clear"><b>✓</b><div><strong>Nenhum gargalo crítico detectado</strong><span>Os indicadores monitorados estão dentro do fluxo esperado.</span></div></div>}</section><aside className="dashboard-health"><p>SAÚDE DO MÓDULO</p><h2>{issues.length ? 'Atenção necessária' : 'Operação estável'}</h2><div className="dashboard-health-score"><strong>{issues.length || 'OK'}</strong><span>{issues.length === 1 ? 'alerta ativo' : issues.length > 1 ? 'alertas ativos' : 'sem alerta crítico'}<small>baseado nos controles visíveis</small></span></div><ul><li><span>Indicadores monitorados</span><strong>{config.indicators.length}</strong></li><li><span>Alertas ativos</span><strong>{issues.length}</strong></li><li><span>Versão do resumo</span><strong>{result.data?.snapshotVersion ?? '—'}</strong></li></ul></aside></div>
      <section className="dashboard-breakdown"><header><div><p>COMPOSIÇÃO</p><h2>Leitura detalhada</h2></div><span>Dados consolidados sem consultar as tabelas operacionais a cada acesso</span></header>{module === 'risk' && Array.isArray(payload.breakdowns.positions) ? <RiskPositions positions={payload.breakdowns.positions as Array<Record<string, unknown>>} /> : module === 'commercial' && Array.isArray(payload.breakdowns.openDemandByCommodity) ? <CommodityBreakdown rows={payload.breakdowns.openDemandByCommodity as Array<Record<string, unknown>>} /> : <div className="dashboard-flow"><div><strong>{config.indicators.filter((item) => !item.attention).length}</strong><span>indicadores de fluxo</span></div><i>→</i><div><strong>{config.indicators.filter((item) => item.attention).length}</strong><span>controles preventivos</span></div><i>→</i><div data-attention={issues.length > 0 || undefined}><strong>{issues.length}</strong><span>ações prioritárias</span></div></div>}</section></> : null}
  </div></AppShell>;
}

function RiskPositions({ positions }: { positions: Array<Record<string, unknown>> }) {
  return <div className="dashboard-table"><table><thead><tr><th>Commodity</th><th>Compra</th><th>Venda</th><th>Posição líquida</th><th>Limite</th><th>Situação</th></tr></thead><tbody>{positions.map((row, index) => <tr key={String(row.commodity ?? index)}><td><strong>{String(row.commodity ?? '—')}</strong></td><td>{formatValue(row.purchase_kg, 'weight')}</td><td>{formatValue(row.sales_kg, 'weight')}</td><td>{formatValue(row.net_open_kg, 'weight')}</td><td>{formatValue(row.max_net_open_kg, 'weight')}</td><td><span data-status={String(row.status ?? '')}>{String(row.status ?? '—')}</span></td></tr>)}</tbody></table></div>;
}
function CommodityBreakdown({ rows }: { rows: Array<Record<string, unknown>> }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.quantity_sc ?? row.quantitySc ?? 0)));
  return <div className="dashboard-bars">{rows.map((row, index) => { const value = Number(row.quantity_sc ?? row.quantitySc ?? 0); return <div key={String(row.commodity ?? index)}><strong>{String(row.commodity ?? 'Outros')}</strong><span><i style={{ width: `${Math.max(3, value / max * 100)}%` }} /></span><em>{formatValue(value)} sc</em></div>; })}</div>;
}
