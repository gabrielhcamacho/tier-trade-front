import Link from 'next/link';
import { AppShell } from '../app-shell';
import { currentUserContext } from '../../lib/current-user';
import { loadOffers } from '../../lib/offers';
import { loadContracts, formatCurrency, formatQuantity } from '../../lib/contracts';
import { loadFinance } from '../../lib/finance';
import { loadRisk } from '../../lib/risk';
import { projectedMarginExact } from '../../lib/projected-margin';

export default async function CentralPage() {
  const user = await currentUserContext();
  const [offers, contracts, finance, risk] = await Promise.all([
    loadOffers(user.identityHeaders), loadContracts(user.identityHeaders),
    loadFinance(user.identityHeaders), loadRisk(user.identityHeaders),
  ]);
  const offerItems = offers.data?.items ?? [];
  const contractItems = contracts.portfolio?.items ?? [];
  const pendingOffers = offerItems.filter((offer) => !['CONVERTED', 'CANCELLED'].includes(offer.status));
  const contractedSc = contractItems.reduce((sum, item) => sum + Number(item.quantity_sc), 0);
  const receivedKg = contractItems.reduce((sum, item) => sum + Number(item.received_weight_kg), 0);
  const projectedMargin = contracts.portfolio ? projectedMarginExact(contractItems) : null;
  const pendingApprovals = offerItems.filter((offer) => offer.status === 'IN_APPROVAL').length;
  const tenant = contracts.portfolio?.tenant.legalName ?? offers.data?.tenant.legalName ?? 'Ambiente autenticado';
  const errors = [...new Set([offers.error, contracts.error, finance.error, risk.error].filter(Boolean))];
  const riskExceptions = risk.data?.positions.filter((position) => ['EXCEEDED', 'WARNING'].includes(position.limit.status)) ?? [];
  return (
    <AppShell activeDomain="central" userLabel={user.userLabel}>
      <div className="prototype-overview">
        <header className="prototype-overview-header">
          <p className="prototype-breadcrumb">Central · {tenant} · posição atual</p>
          <h1>Visão geral</h1>
          <p>Resultado, caixa, risco e decisões que não podem esperar</p>
        </header>
        {errors.length > 0 ? <div className="feedback critical"><strong>Dados parciais</strong><span>{errors.join(' ')}</span></div> : null}
          <div className="prototype-overview-filters"><span>Empresa<br /><strong>{tenant}</strong></span><span>Commodity<br /><strong>Milho e soja</strong></span><span>Posição<br /><strong>{errors.length > 0 ? 'Dados parciais' : 'Atualizada pela API'}</strong></span></div>
          <section className="prototype-kpis" aria-label="Indicadores consolidados">
            <article><small>Margem projetada da carteira</small><strong>{projectedMargin ?? '—'}</strong><span>{projectedMargin ? 'Contratos vigentes' : contracts.portfolio ? 'Aguardando política de arredondamento' : 'Contratos indisponíveis'}</span></article>
            <article><small>Volume contratado</small><strong>{contracts.portfolio ? formatQuantity(String(contractedSc)) : '—'} <em>{contracts.portfolio ? 'sc' : ''}</em></strong><span>{contracts.portfolio ? `${contractItems.length} contratos` : 'Contratos indisponíveis'}</span></article>
            <article><small>Caixa realizado</small><strong>{finance.data ? formatCurrency(finance.data.summary.netCashFlowAmount) : '—'}</strong><span>Recebimentos menos pagamentos registrados</span></article>
            <article><small>A receber</small><strong>{finance.data ? formatCurrency(finance.data.summary.receivableAmount) : '—'}</strong><span>Saldo informado pelo financeiro</span></article>
            <article><small>Aprovações pendentes</small><strong>{offers.data ? pendingApprovals : '—'}</strong><span>{offers.data ? `${pendingOffers.length} ofertas em aberto` : 'Ofertas indisponíveis'}</span></article>
          </section>
          <div className="prototype-overview-grid">
            <div>
              <section className="prototype-overview-section">
                <h2>Ponte de margem · prevista → realizada</h2>
                <p>Volume entregue · causas e evidências por contrato</p>
                <div className="prototype-unavailable-chart"><strong>Comparação ainda indisponível</strong><span>O backend já calcula a margem projetada dos contratos, mas ainda não entrega a margem realizada com a decomposição de frete, qualidade, armazenagem e financeiro. Nenhum valor demonstrativo é apresentado como resultado.</span></div>
              </section>
              <section className="prototype-overview-section">
                <h2>Projeção de caixa</h2>
                <p>Saldo futuro por período</p>
                <div className="prototype-unavailable-chart"><strong>Série temporal ainda indisponível</strong><span>O financeiro fornece posição e caixa realizado; a projeção por data depende da consolidação de títulos, vencimentos e pagamentos futuros.</span></div>
              </section>
              <section className="prototype-overview-section">
                <h2>Volume contratado × executado</h2>
                <p>Execução física dos contratos deste tenant</p>
                {contracts.portfolio ? <div className="prototype-volume-chart">
                  <div><span>Contratado</span><i style={{ width: '100%' }} /><strong>{formatQuantity(String(contractedSc * 60 / 1000))} t</strong></div>
                  <div><span>Recebido</span><i style={{ width: contractedSc > 0 ? `${Math.min(100, receivedKg / (contractedSc * 60) * 100)}%` : '0%' }} /><strong>{formatQuantity(String(receivedKg / 1000))} t</strong></div>
                </div> : <div className="prototype-unavailable-chart">Contratos indisponíveis no momento.</div>}
              </section>
              <section className="prototype-overview-section">
                <h2>Exceções relevantes</h2>
                <table className="prototype-ledger"><thead><tr><th>Exceção</th><th>Impacto</th><th>Abrir</th></tr></thead><tbody>
                  {pendingApprovals > 0 ? <tr><td>Ofertas aguardando aprovação</td><td>{pendingApprovals}</td><td><Link href="/">Ofertas →</Link></td></tr> : null}
                  {riskExceptions.map((position) =>
                    <tr key={position.commodity}><td>Limite de risco · {position.commodity}</td><td>{position.limit.status === 'EXCEEDED' ? 'Excedido' : 'Em atenção'}</td><td><Link href="/risco">Posição →</Link></td></tr>)}
                  {offers.data && risk.data && pendingApprovals === 0 && riskExceptions.length === 0
                    ? <tr><td colSpan={3}>Nenhuma exceção consolidada no recorte atual.</td></tr> : null}
                  {!offers.data || !risk.data ? <tr><td colSpan={3}>Exceções parciais: {offers.data ? '' : 'Comercial '} {risk.data ? '' : 'Risco '}indisponível.</td></tr> : null}
                </tbody></table>
              </section>
            </div>
            <aside className="prototype-overview-aside">
              <section><p className="section-kicker">INSIGHTS</p><h2>Análises verificáveis</h2><p>Os indicadores acima vêm dos módulos Comercial, Contratos, Financeiro e Risco. A ponte de margem prevista → realizada e projeções de caixa exigem dados e regras adicionais; não serão simuladas como resultado real.</p></section>
              <section><p className="section-kicker">MINHA FILA</p><strong>{offers.data ? `${pendingApprovals} aprovação(ões) pendente(s)` : 'Ofertas indisponíveis'}</strong><Link href="/central/fila">Ver Minha fila completa →</Link></section>
              <section><p className="section-kicker">ATALHOS</p><div className="prototype-shortcuts"><Link href="/">Ofertas</Link><Link href="/contratos">Contratos</Link><Link href="/financeiro">Financeiro</Link><Link href="/risco">Risco</Link></div></section>
            </aside>
          </div>
      </div>
    </AppShell>
  );
}
