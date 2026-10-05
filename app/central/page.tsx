import Link from 'next/link';
import { AppShell } from '../app-shell';
import { currentUserContext } from '../../lib/current-user';
import { commodityLabel, formatCurrency, formatQuantity } from '../../lib/contracts';
import { formatFinancialDate } from '../../lib/finance';
import { formatWeight } from '../../lib/risk';
import { loadOverview } from '../../lib/overview';
import { CommodityFilter } from './commodity-filter';

const tonnes = (kg: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(kg / 1000)} t`;
const percent = (part: number, total: number) => total > 0 ? Math.min(100, Math.max(0, part / total * 100)) : 0;
const currency = (value: number | string) => formatCurrency(String(value));

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="overview-empty"><strong>{title}</strong><span>{detail}</span></div>;
}

export default async function CentralPage({ searchParams }: { searchParams: Promise<{ commodity?: string }> }) {
  const user = await currentUserContext();
  const requested = (await searchParams).commodity;
  const commodity = requested === 'MILHO' || requested === 'SOJA' ? requested : 'ALL';
  const overview = await loadOverview(user.identityHeaders, commodity);
  const sources = overview.data?.sources;
  const offers = { data: sources?.offers ?? null, error: overview.error };
  const contracts = { portfolio: sources?.contracts ?? null, error: overview.error };
  const finance = { data: sources?.finance ?? null, error: overview.error };
  const risk = { data: sources?.risk ?? null, error: overview.error };
  const inventory = { data: sources?.inventory ?? null, error: overview.error };
  const offerItems = (offers.data?.items ?? []).filter((item) => commodity === 'ALL' || item.commodity === commodity);
  const contractItems = (contracts.portfolio?.items ?? []).filter((item) => commodity === 'ALL' || item.commodity === commodity);
  const positions = (risk.data?.positions ?? []).filter((item) => commodity === 'ALL' || item.commodity === commodity);
  const approvals = offerItems.filter((item) => item.status === 'IN_APPROVAL');
  const obligations = contractItems.reduce((sum, item) => sum + item.pending_obligations, 0);
  const riskExceptions = positions.filter((item) => item.limit.status === 'EXCEEDED' || item.limit.status === 'WARNING');
  const contractedKg = Number(overview.data?.indicators.purchaseContractedKg ?? 0);
  const receivedKg = Number(overview.data?.indicators.purchaseReceivedKg ?? 0);
  const margin = overview.data?.indicators.projectedMarginAmount;
  const tenant = overview.data?.tenant.legalName ?? 'Ambiente autenticado';
  const isDemo = Boolean(overview.data?.tenant.isDemo);
  const errors = [...new Set([offers.error, contracts.error, finance.error, risk.error, inventory.error].filter(Boolean))];
  const consultedAt = overview.data ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: overview.data.tenant.timezone }).format(new Date(overview.data.assembledAt)) : '—';

  const marginRows = (overview.data?.charts.marginComponents ?? []).flatMap((component) => {
    const item = contractItems.find((candidate) => candidate.id === component.contractId);
    if (!item) return [];
    return [{ item, value: component.amount === null ? null : Number(component.amount),
      exact: component.amount === null ? null : currency(component.amount) }];
  });
  const maxMargin = Math.max(...marginRows.map((row) => Math.abs(row.value ?? 0)), 0);
  const volumeRows = (overview.data?.charts.byCommodity ?? []).map((row) => ({
    name: row.commodity,
    purchase: Number(row.purchaseContractedKg), received: Number(row.purchaseReceivedKg),
    sold: Number(row.salesContractedKg), dispatched: Number(row.salesDispatchedKg),
  }));
  const dueRows = (overview.data?.charts.dueDates ?? []).slice(0, 8);
  const maxDue = Math.max(...dueRows.flatMap((row) => [Number(row.inflowAmount), Number(row.outflowAmount)]), 0);
  const exceptions = [
    ...approvals.map((item) => ({ id: item.id, title: `Oferta aguardando aprovação · ${item.counterparty_name}`, impact: `${formatQuantity(item.quantity_sc)} sc`, owner: 'Alçada comercial', href: `/?status=IN_APPROVAL&commodity=${item.commodity}` })),
    ...riskExceptions.map((item) => ({ id: item.commodity, title: `Limite de posição ${item.limit.status === 'EXCEEDED' ? 'excedido' : 'em atenção'} · ${commodityLabel(item.commodity)}`, impact: item.limit.usagePct ? `${item.limit.usagePct}% utilizado` : formatWeight(item.physical.netContractualKg), owner: 'Risco e direção', href: '/risco' })),
    ...contractItems.filter((item) => item.pending_obligations > 0).map((item) => ({ id: item.id, title: `Obrigações pendentes · ${item.counterparty_name}`, impact: `${item.pending_obligations} pendência(s)`, owner: 'Contratos', href: `/contratos/${item.id}` })),
    ...(overview.data?.operational.openOccurrences ? [{ id: 'operations', title: 'Ocorrências operacionais abertas', impact: `${overview.data.operational.openOccurrences} ocorrência(s)${overview.data.operational.criticalOccurrences ? ` · ${overview.data.operational.criticalOccurrences} crítica(s)` : ''}`, owner: 'Operações', href: '/ocorrencias' }] : []),
    ...(overview.data?.operational.qualityReviews ? [{ id: 'quality', title: 'Recebimentos aguardando decisão de qualidade', impact: `${overview.data.operational.qualityReviews} revisão(ões)`, owner: 'Qualidade', href: '/qualidade' }] : []),
    ...(overview.data && (overview.data.operational.fiscalPending || overview.data.operational.fiscalRejected) ? [{ id: 'fiscal', title: 'Documentos fiscais exigem conferência', impact: `${overview.data.operational.fiscalPending} pendente(s) · ${overview.data.operational.fiscalRejected} rejeitado(s)`, owner: 'Fiscal', href: '/fiscal/entradas' }] : []),
    ...(overview.data?.indicators.paymentBatchApprovalCount ? [{ id: 'payment-batches', title: 'Lotes de pagamento aguardam aprovação', impact: `${overview.data.indicators.paymentBatchApprovalCount} lote(s)`, owner: 'Alçada financeira', href: '/financeiro#lotes' }] : []),
    ...(overview.data?.indicators.unmatchedBankEntryCount ? [{ id: 'bank-reconciliation', title: 'Lançamentos bancários sem conciliação', impact: `${overview.data.indicators.unmatchedBankEntryCount} lançamento(s)`, owner: 'Financeiro', href: '/financeiro#conciliacao-bancaria' }] : []),
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
      <Link href="/contratos"><small>Margem projetada · contratos</small><strong>{margin === null || margin === undefined ? '—' : currency(margin)}</strong><span>{contractItems.length ? margin !== null ? `${contractItems.length} contrato(s) no recorte` : 'Arredondamento pendente' : contracts.portfolio ? 'Sem contratos no recorte' : 'Fonte indisponível'}</span></Link>
      <Link href="/financeiro#margem-realizada"><small>Margem realizada · execução</small><strong>{overview.data?.indicators.realizedMarginStatus === 'COMPLETE' ? currency(overview.data.indicators.realizedMarginAmount) : '—'}</strong><span>{overview.data?.indicators.realizedMarginStatus === 'COMPLETE' ? 'venda − compra − composição apropriada' : 'aguardando compra e venda conectadas'}</span></Link>
      <Link href="/contratos"><small>Execução de compras</small><strong>{contracts.portfolio && contractedKg > 0 ? `${Math.round(percent(receivedKg, contractedKg))}%` : '—'}</strong><span>{contracts.portfolio && contractedKg > 0 ? `${tonnes(receivedKg)} de ${tonnes(contractedKg)}` : contracts.portfolio ? 'Sem volume no recorte' : 'Fonte indisponível'}</span></Link>
      <Link href="/financeiro"><small>Caixa realizado · líquido</small><strong>{finance.data ? currency(finance.data.summary.netCashFlowAmount) : '—'}</strong><span>Recebido − pago · consolidado</span></Link>
      <Link href="/financeiro"><small>Contas a receber</small><strong>{finance.data ? currency(finance.data.summary.receivableAmount) : '—'}</strong><span>Saldo em aberto · consolidado</span></Link>
      <Link href="/central/fila"><small>Decisões e pendências</small><strong>{overview.data ? approvals.length + obligations + overview.data.operational.openOccurrences + overview.data.operational.qualityReviews + overview.data.operational.fiscalPending : '—'}</strong><span>{overview.data ? `${approvals.length} aprovação(ões) · ${overview.data.operational.openOccurrences} ocorrência(s) · ${overview.data.operational.fiscalPending} fiscal(is)` : 'Fontes parciais'}</span></Link>
    </section>
    <div className="overview-layout"><div className="overview-main">
      <section className="overview-section overview-hero-chart"><div className="overview-section-title"><div><h2>Onde está a margem projetada</h2><p>Contribuição por contrato de compra · composição do total acima</p></div><Link href="/contratos">Ver contratos →</Link></div>
        {contracts.portfolio && marginRows.length ? <div className="overview-margin-bars">{marginRows.slice(0, 6).map(({ item, value, exact }) => <div className="overview-margin-row" key={item.id}><Link href={`/contratos/${item.id}`}>{item.counterparty_name}<small>{commodityLabel(item.commodity)} · {item.id.slice(0, 8)}</small></Link><div className="overview-margin-track"><i className={value !== null && value < 0 ? 'negative' : ''} style={{ width: value === null ? '0%' : `${Math.max(3, percent(Math.abs(value), maxMargin))}%` }} /></div><strong>{exact ?? '—'}</strong></div>)}</div> : <Empty title="Sem contratos no recorte" detail="A margem será apresentada quando houver contratos e política vigente." />}
        <p className="overview-method">Memória: quantidade em sc × margem projetada por sc. A margem realizada usa receita expedida menos custo de aquisição e componentes da compra persistidos; frações não são arredondadas silenciosamente.</p>
      </section>
      <div className="overview-chart-pair"><section className="overview-section"><div className="overview-section-title"><div><h2>Vencimentos conhecidos</h2><p>Saldo aberto por data · recebimentos e obrigações</p></div><Link href="/financeiro">Financeiro →</Link></div>
        {finance.data && dueRows.length ? <div className="overview-due-bars">{dueRows.map((row) => <div className="overview-due-row" key={row.date}><time dateTime={row.date}>{formatFinancialDate(row.date)}</time><div><i style={{ width: `${percent(Number(row.inflowAmount), maxDue)}%` }} title={`A receber ${row.inflowAmount === null ? '—' : currency(row.inflowAmount)}`} /><i className="outflow" style={{ width: `${percent(Number(row.outflowAmount), maxDue)}%` }} title={`A pagar ${row.outflowAmount === null ? '—' : currency(row.outflowAmount)}`} /></div><strong>{row.netKnownAmount === null ? '—' : currency(row.netKnownAmount)}</strong></div>)}<div className="overview-legend"><span>■ A receber</span><span>■ A pagar</span></div></div> : <Empty title="Sem títulos abertos" detail="Os vencimentos surgem após emissão de títulos e obrigações." />}
        <p className="overview-method">Não é projeção de caixa: não inclui saldo bancário inicial nem movimentos futuros sem título.</p>
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
      <section><div className="overview-rail-title"><strong>ATALHOS</strong></div><div className="overview-shortcuts"><Link href="/">Ofertas</Link><Link href="/contratos">Contratos</Link><Link href="/ocorrencias">Ocorrências</Link><Link href="/fiscal/entradas">Entrada fiscal</Link><Link href="/financeiro">Financeiro</Link><Link href="/risco">Posição e risco</Link></div></section>
    </aside></div>
  </main></AppShell>;
}
