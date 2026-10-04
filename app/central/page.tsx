import Link from 'next/link';
import { AppShell } from '../app-shell';
import { currentUserContext } from '../../lib/current-user';
import { loadOffers } from '../../lib/offers';
import { loadContracts, commodityLabel, formatCurrency, formatQuantity } from '../../lib/contracts';
import { loadFinance, formatFinancialDate } from '../../lib/finance';
import { loadRisk, formatWeight } from '../../lib/risk';
import { loadInventory } from '../../lib/inventory';
import { projectedMarginExact } from '../../lib/projected-margin';
import { CommodityFilter } from './commodity-filter';

const tonnes = (kg: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(kg / 1000)} t`;
const percent = (part: number, total: number) => total > 0 ? Math.min(100, Math.max(0, part / total * 100)) : 0;
const currency = (value: number | string) => formatCurrency(String(value));
const micros = (value: string): bigint | null => {
  const match = /^(-?)(\d+)(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) return null;
  const amount = BigInt(match[2]) * BigInt(1_000_000) + BigInt((match[3] ?? '').padEnd(6, '0') || '0');
  return match[1] ? -amount : amount;
};
const exactMoney = (value: bigint): string | null => {
  if (value % BigInt(10_000) !== BigInt(0)) return null;
  const cents = value / BigInt(10_000);
  const absolute = cents < BigInt(0) ? -cents : cents;
  const whole = (absolute / BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cents < BigInt(0) ? '-' : ''}R$ ${whole},${String(absolute % BigInt(100)).padStart(2, '0')}`;
};

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="overview-empty"><strong>{title}</strong><span>{detail}</span></div>;
}

export default async function CentralPage({ searchParams }: { searchParams: Promise<{ commodity?: string }> }) {
  const user = await currentUserContext();
  const requested = (await searchParams).commodity;
  const commodity = requested === 'MILHO' || requested === 'SOJA' ? requested : 'ALL';
  const [offers, contracts, finance, risk, inventory] = await Promise.all([
    loadOffers(user.identityHeaders), loadContracts(user.identityHeaders), loadFinance(user.identityHeaders),
    loadRisk(user.identityHeaders), loadInventory(user.identityHeaders),
  ]);
  const offerItems = (offers.data?.items ?? []).filter((item) => commodity === 'ALL' || item.commodity === commodity);
  const contractItems = (contracts.portfolio?.items ?? []).filter((item) => commodity === 'ALL' || item.commodity === commodity);
  const sales = (inventory.data?.salesContracts ?? []).filter((item) => commodity === 'ALL' || item.commodity === commodity);
  const positions = (risk.data?.positions ?? []).filter((item) => commodity === 'ALL' || item.commodity === commodity);
  const approvals = offerItems.filter((item) => item.status === 'IN_APPROVAL');
  const obligations = contractItems.reduce((sum, item) => sum + item.pending_obligations, 0);
  const riskExceptions = positions.filter((item) => item.limit.status === 'EXCEEDED' || item.limit.status === 'WARNING');
  const contractedKg = contractItems.reduce((sum, item) => sum + Number(item.quantity_sc) * 60, 0);
  const receivedKg = contractItems.reduce((sum, item) => sum + Number(item.received_weight_kg), 0);
  const margin = contracts.portfolio ? projectedMarginExact(contractItems) : null;
  const tenant = contracts.portfolio?.tenant.legalName ?? offers.data?.tenant.legalName ?? finance.data?.tenant.legalName ?? 'Ambiente autenticado';
  const isDemo = Boolean(contracts.portfolio?.tenant.isDemo ?? offers.data?.tenant.isDemo ?? finance.data?.tenant.isDemo);
  const errors = [...new Set([offers.error, contracts.error, finance.error, risk.error, inventory.error].filter(Boolean))];
  const consultedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date());

  const marginRows = contractItems.map((item) => {
    const exact = projectedMarginExact([item]);
    const value = exact ? Number(exact.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.')) : null;
    return { item, value, exact };
  });
  const maxMargin = Math.max(...marginRows.map((row) => Math.abs(row.value ?? 0)), 0);
  const volumeRows = [...new Set([...contractItems.map((item) => item.commodity), ...sales.map((item) => item.commodity)])].sort().map((name) => ({
    name,
    purchase: contractItems.filter((item) => item.commodity === name).reduce((sum, item) => sum + Number(item.quantity_sc) * 60, 0),
    received: contractItems.filter((item) => item.commodity === name).reduce((sum, item) => sum + Number(item.received_weight_kg), 0),
    sold: sales.filter((item) => item.commodity === name).reduce((sum, item) => sum + Number(item.quantity_kg), 0),
    dispatched: sales.filter((item) => item.commodity === name).reduce((sum, item) => sum + Number(item.dispatched_kg), 0),
  }));
  const due = new Map<string, { inflow: bigint; outflow: bigint }>();
  let impreciseDueCount = 0;
  for (const event of finance.data?.events ?? []) {
    if (!event.title?.dueDate || Number(event.title.outstandingAmount) <= 0) continue;
    const amount = micros(event.title.outstandingAmount);
    if (amount === null || amount % BigInt(10_000) !== BigInt(0)) { impreciseDueCount++; continue; }
    const current = due.get(event.title.dueDate) ?? { inflow: BigInt(0), outflow: BigInt(0) };
    current[event.direction === 'INFLOW' ? 'inflow' : 'outflow'] += amount;
    due.set(event.title.dueDate, current);
  }
  const dueRows = [...due].sort(([a], [b]) => a.localeCompare(b)).slice(0, 8);
  const maxDue = Math.max(...dueRows.flatMap(([, value]) => [Number(value.inflow), Number(value.outflow)]), 0);
  const exceptions = [
    ...approvals.map((item) => ({ id: item.id, title: `Oferta aguardando aprovação · ${item.counterparty_name}`, impact: `${formatQuantity(item.quantity_sc)} sc`, owner: 'Alçada comercial', href: `/?status=IN_APPROVAL&commodity=${item.commodity}` })),
    ...riskExceptions.map((item) => ({ id: item.commodity, title: `Limite de posição ${item.limit.status === 'EXCEEDED' ? 'excedido' : 'em atenção'} · ${commodityLabel(item.commodity)}`, impact: item.limit.usagePct ? `${item.limit.usagePct}% utilizado` : formatWeight(item.physical.netContractualKg), owner: 'Risco e direção', href: '/risco' })),
    ...contractItems.filter((item) => item.pending_obligations > 0).map((item) => ({ id: item.id, title: `Obrigações pendentes · ${item.counterparty_name}`, impact: `${item.pending_obligations} pendência(s)`, owner: 'Contratos', href: `/contratos/${item.id}` })),
  ].slice(0, 8);

  return <AppShell activeDomain="central" userLabel={user.userLabel}><main className="overview-dashboard">
    <header className="overview-head">
      <p className="overview-eyebrow">Central · Direção e gestão · {tenant} · carteira atual</p>
      <div className="overview-heading-line"><div><h1>Visão geral</h1><p>Resultado, execução, caixa e decisões que não podem esperar</p></div><div className="overview-updated"><span className={errors.length ? 'partial' : ''} /> Consultado em {consultedAt}<small>Horário de atualização das fontes não informado</small></div></div>
      <div className="overview-filters">
        <div><small>Empresa</small><strong>{tenant} ⌁</strong></div>
        <CommodityFilter selected={commodity} />
        <div><small>Unidade de medida</small><strong>Saca de 60 kg</strong></div>
        <div className="overview-filter-unavailable" title="Unidade operacional ainda não fornecida para toda a carteira"><small>Unidade operacional</small><strong>Indisponível</strong></div>
        <div className="overview-filter-unavailable" title="Safra e período ainda não são fornecidos por todos os módulos"><small>Safra / período</small><strong>Carteira completa</strong></div>
      </div>
      {commodity !== 'ALL' ? <p className="overview-filter-hint">Filtro aplicado a ofertas, contratos, volumes e risco. O financeiro permanece consolidado, pois os títulos não trazem vínculo completo com commodity. <Link href="/central">Limpar</Link></p> : null}
    </header>
    {isDemo ? <div className="overview-demo-note">Ambiente de demonstração · dados salvos no backend deste tenant, editáveis e isolados das outras contas.</div> : null}
    {errors.length ? <div className="feedback critical"><strong>Dados parciais</strong><span>{errors.join(' ')}</span></div> : null}
    <section className="overview-kpis" aria-label="Indicadores prioritários">
      <Link href="/contratos"><small>Margem projetada · contratos</small><strong>{margin ?? '—'}</strong><span>{margin ? `${contractItems.length} contrato(s) no recorte` : contracts.portfolio ? 'Arredondamento pendente' : 'Fonte indisponível'}</span></Link>
      <Link href="/contratos"><small>Execução de compras</small><strong>{contracts.portfolio ? `${Math.round(percent(receivedKg, contractedKg))}%` : '—'}</strong><span>{contracts.portfolio ? `${tonnes(receivedKg)} de ${tonnes(contractedKg)}` : 'Fonte indisponível'}</span></Link>
      <Link href="/financeiro"><small>Caixa realizado · líquido</small><strong>{finance.data ? currency(finance.data.summary.netCashFlowAmount) : '—'}</strong><span>Recebido − pago · consolidado</span></Link>
      <Link href="/financeiro"><small>Contas a receber</small><strong>{finance.data ? currency(finance.data.summary.receivableAmount) : '—'}</strong><span>Saldo em aberto · consolidado</span></Link>
      <Link href="/?status=IN_APPROVAL"><small>Decisões e pendências</small><strong>{offers.data && contracts.portfolio ? approvals.length + obligations : '—'}</strong><span>{offers.data && contracts.portfolio ? `${approvals.length} aprovação(ões) · ${obligations} obrigação(ões)` : 'Fontes parciais'}</span></Link>
    </section>
    <div className="overview-layout"><div className="overview-main">
      <section className="overview-section overview-hero-chart"><div className="overview-section-title"><div><h2>Onde está a margem projetada</h2><p>Contribuição por contrato de compra · composição do total acima</p></div><Link href="/contratos">Ver contratos →</Link></div>
        {contracts.portfolio && marginRows.length ? <div className="overview-margin-bars">{marginRows.slice(0, 6).map(({ item, value, exact }) => <div className="overview-margin-row" key={item.id}><Link href={`/contratos/${item.id}`}>{item.counterparty_name}<small>{commodityLabel(item.commodity)} · {item.id.slice(0, 8)}</small></Link><div className="overview-margin-track"><i className={value !== null && value < 0 ? 'negative' : ''} style={{ width: value === null ? '0%' : `${Math.max(3, percent(Math.abs(value), maxMargin))}%` }} /></div><strong>{exact ?? '—'}</strong></div>)}</div> : <Empty title="Sem contratos no recorte" detail="A margem será apresentada quando houver contratos e política vigente." />}
        <p className="overview-method">Memória: quantidade em sc × margem projetada por sc, valor de cada contrato retornado pela API. Frações de centavo não são arredondadas silenciosamente. A ponte prevista → realizada depende do motor de margem realizada e das causas homologadas.</p>
      </section>
      <div className="overview-chart-pair"><section className="overview-section"><div className="overview-section-title"><div><h2>Vencimentos conhecidos</h2><p>Saldo aberto por data · recebimentos e obrigações</p></div><Link href="/financeiro">Financeiro →</Link></div>
        {finance.data && dueRows.length ? <div className="overview-due-bars">{dueRows.map(([date, amounts]) => <div className="overview-due-row" key={date}><time dateTime={date}>{formatFinancialDate(date)}</time><div><i style={{ width: `${percent(Number(amounts.inflow), maxDue)}%` }} title={`A receber ${exactMoney(amounts.inflow)}`} /><i className="outflow" style={{ width: `${percent(Number(amounts.outflow), maxDue)}%` }} title={`A pagar ${exactMoney(amounts.outflow)}`} /></div><strong>{exactMoney(amounts.inflow - amounts.outflow) ?? '—'}</strong></div>)}<div className="overview-legend"><span>■ A receber</span><span>■ A pagar</span></div></div> : <Empty title="Sem títulos abertos" detail="Os vencimentos surgem após emissão de títulos e obrigações." />}
        <p className="overview-method">Não é projeção de caixa: não inclui saldo bancário inicial nem movimentos futuros sem título.{impreciseDueCount ? ` ${impreciseDueCount} título(s) com fração de centavo não exibido(s); aguardam política de arredondamento.` : ''}</p>
      </section><section className="overview-section"><div className="overview-section-title"><div><h2>Contratado × executado</h2><p>Toneladas · recebimentos de compra e expedições de venda</p></div><Link href="/estoque">Estoque →</Link></div>
        {contracts.portfolio && inventory.data && volumeRows.length ? <div className="overview-volume-bars">{volumeRows.map((row) => <div className="overview-volume-group" key={row.name}><strong>{commodityLabel(row.name)}</strong><div><span>Compra</span><div className="overview-volume-track"><i /><b style={{ width: `${percent(row.received, row.purchase)}%` }} /></div><em>{tonnes(row.received)} / {tonnes(row.purchase)}</em></div>{row.sold > 0 ? <div><span>Venda</span><div className="overview-volume-track"><i /><b style={{ width: `${percent(row.dispatched, row.sold)}%` }} /></div><em>{tonnes(row.dispatched)} / {tonnes(row.sold)}</em></div> : null}</div>)}<div className="overview-legend"><span>□ Contratado</span><span>■ Executado</span></div></div> : <Empty title="Sem execução no recorte" detail="Contratos e movimentos físicos aparecerão aqui." />}
        <p className="overview-method">Compra em sc × 60 kg; execução conforme pesagens. Venda conforme contratos e expedições registradas.</p>
      </section></div>
      <section className="overview-section"><div className="overview-section-title"><div><h2>Exceções relevantes</h2><p>{exceptions.length} item(ns) · gravidade, impacto conhecido e responsável</p></div><Link href="/central/fila">Minha fila →</Link></div><div className="overview-table-wrap"><table><thead><tr><th>Exceção</th><th>Impacto conhecido</th><th>Responsável</th><th>Ação</th></tr></thead><tbody>{exceptions.length ? exceptions.map((item, index) => <tr key={`${item.id}-${index}`}><td><b className="overview-rank">{index + 1}</b>{item.title}</td><td>{item.impact}</td><td>{item.owner}</td><td><Link href={item.href}>Abrir →</Link></td></tr>) : <tr><td colSpan={4}>{errors.length ? 'Algumas fontes não responderam; não é possível descartar exceções.' : 'Nenhuma exceção identificada nas fontes conectadas.'}</td></tr>}</tbody></table></div></section>
    </div><aside className="overview-rail"><section><div className="overview-rail-title"><strong>ANÁLISES OPERACIONAIS</strong><span>evidências do backend</span></div>
      {riskExceptions.slice(0, 2).map((item) => <article className="overview-insight" key={item.commodity}><b>!</b><div><h3>Limite de {commodityLabel(item.commodity)} {item.limit.status === 'EXCEEDED' ? 'excedido' : 'em atenção'}</h3><p>Posição líquida de {formatWeight(item.physical.netContractualKg)}{item.limit.usagePct ? `; uso de ${item.limit.usagePct}% do limite` : ''}. Revise antes de novas operações.</p><small>Fonte: Risco · regra v{item.limit.version ?? '—'} · decide: Risco/Direção</small><Link href="/risco">Ver evidências →</Link></div></article>)}
      {approvals.length ? <article className="overview-insight"><b>!</b><div><h3>{approvals.length} oferta(s) aguardam decisão</h3><p>{formatQuantity(String(approvals.reduce((sum, item) => sum + Number(item.quantity_sc), 0)))} sc em aprovação no recorte.</p><small>Fonte: Ofertas · decide: alçada comercial</small><Link href={`/?status=IN_APPROVAL&commodity=${approvals[0].commodity}`}>Ver ofertas →</Link></div></article> : null}
      {obligations ? <article className="overview-insight"><b>i</b><div><h3>{obligations} obrigação(ões) contratuais pendentes</h3><p>Confira documentos e programação antes da execução física.</p><small>Fonte: Contratos · decide: equipe contratual</small><Link href="/contratos">Ver contratos →</Link></div></article> : null}
      {!riskExceptions.length && !approvals.length && !obligations ? <p className="overview-rail-empty">{errors.length ? 'Análise parcial: há fontes indisponíveis.' : 'Nenhum desvio detectado nas regras disponíveis.'}</p> : null}
      <p className="overview-ai-note">Insights por IA ainda indisponíveis. Não exibimos causas, impactos ou confiança sem motor e evidências homologados.</p></section>
      <section><div className="overview-rail-title"><strong>OFERTAS EM DECISÃO</strong><span>{approvals.length} aprovação(ões)</span></div>{approvals.slice(0, 2).map((item) => <Link className="overview-queue-item" href={`/?status=IN_APPROVAL&commodity=${item.commodity}`} key={item.id}><strong>{commodityLabel(item.commodity)} · {item.counterparty_name}</strong><span>Ver carteira →</span></Link>)}<Link href="/?status=IN_APPROVAL">Ver ofertas em aprovação →</Link></section>
      <section><div className="overview-rail-title"><strong>ATALHOS</strong></div><div className="overview-shortcuts"><Link href="/">Ofertas</Link><Link href="/contratos">Contratos</Link><Link href="/financeiro">Financeiro</Link><Link href="/risco">Posição e risco</Link></div></section>
    </aside></div>
  </main></AppShell>;
}
