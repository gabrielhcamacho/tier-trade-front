import Link from 'next/link';
import { AppShell } from '../../../app-shell';
import { currentUserContext } from '../../../../lib/current-user';
import { formatCurrency, formatDate } from '../../../../lib/contracts';
import { loadDemand, loadDemands } from '../../../../lib/demands';
import { DemandForm } from '../demand-form';
import { CloseDemandForm, NegotiationForm } from '../negotiation-forms';

export default async function DemandDetailPage({ params }: { params: Promise<{ demandId: string }> }) {
  const { demandId } = await params;
  const user = await currentUserContext();
  const [detail, list] = await Promise.all([loadDemand(demandId, user.identityHeaders), loadDemands(user.identityHeaders)]);
  const demand = detail.data?.demand;
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    <div className="prototype-list-page"><header className="prototype-list-header"><div>
      <p className="prototype-breadcrumb"><Link href="/comercial/demandas">Comercial › Demandas</Link> <span>›</span> Detalhe</p>
      <h1>{demand ? `${demand.direction === 'PURCHASE' ? 'Compra' : 'Venda'} · ${demand.counterparty_name}` : 'Demanda'}</h1>
      <p>{demand ? `${demand.commodity === 'MILHO' ? 'Milho' : 'Soja'} · ${demand.status === 'OPEN' ? 'Aberta' : 'Encerrada'} · versão ${demand.version}` : 'Consulta de intenção comercial'}</p>
    </div></header>
    {detail.error || list.error ? <div className="feedback critical" role="alert">{detail.error ?? list.error}</div> : null}
    {demand && list.data ? <>
      <section className="commercial-demand-section"><p className="section-kicker">CONDIÇÕES PRELIMINARES</p><h2>Demanda</h2>
        <p>Entrega de {formatDate(demand.delivery_start)} a {formatDate(demand.delivery_end)}. Preço indicativo: {demand.indicative_price_per_sc ? `${formatCurrency(demand.indicative_price_per_sc)}/sc` : 'não informado'}.</p>
        <DemandForm demand={demand} counterparties={list.data.counterparties} /></section>
      <section className="commercial-demand-section"><p className="section-kicker">RASTREABILIDADE</p><h2>Negociações</h2>
        {demand.status === 'OPEN' ? <NegotiationForm id={demand.id} /> : null}
        {detail.data!.negotiations.length === 0 ? <p>Nenhuma interação registrada.</p> : <ol className="commercial-negotiation-list">
          {detail.data!.negotiations.map((entry) => <li key={entry.id}><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</time>
            <p>{entry.note}</p><small>{entry.indicative_price_per_sc ? `${formatCurrency(entry.indicative_price_per_sc)}/sc · indicativo` : 'Sem preço informado'}</small></li>)}
        </ol>}</section>
      {demand.status === 'OPEN' ? <section className="commercial-demand-section"><p className="section-kicker">ENCERRAMENTO</p><h2>Encerrar demanda</h2>
        <p>O encerramento preserva o histórico; não cria oferta nem contrato automaticamente.</p><CloseDemandForm id={demand.id} /></section>
        : <div className="feedback">Encerrada: {demand.close_reason}</div>}
    </> : null}</div>
  </AppShell>;
}
