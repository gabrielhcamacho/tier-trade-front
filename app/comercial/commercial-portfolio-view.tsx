import Link from 'next/link';
import type { ContractPortfolio } from '../../lib/contracts';
import { commodityLabel, contractStatusLabel, formatCurrency, formatQuantity } from '../../lib/contracts';
import type { CommercialDemand } from '../../lib/demands';
import type { OfferPortfolio, OfferListItem } from '../../lib/offers';
import { ClickableTableRow } from '../clickable-table-row';

const offerStatuses: Record<string, string> = {
  DRAFT: 'Em estruturação', IN_APPROVAL: 'Em aprovação', APPROVED: 'Confirmada',
  CONVERTED: 'Contrato criado', CANCELLED: 'Cancelada',
};

export function CommercialPortfolioView({ offers, demands, contracts }: {
  offers: OfferPortfolio;
  demands: CommercialDemand[];
  contracts: ContractPortfolio;
}) {
  const openDemands = demands.filter((item) => item.status === 'OPEN');
  const activeOffers = offers.items.filter((item) => !['CANCELLED', 'CONVERTED'].includes(item.status));
  const activeContracts = contracts.items.filter((item) => ['SIGNED', 'ACTIVE'].includes(item.status));
  const margin = contracts.items.reduce(
    (sum, item) => sum + Number(item.quantity_sc) * Number(item.projected_margin_per_sc), 0);
  return <>
    <section className="contract-portfolio-metrics" aria-label="Resumo comercial">
      <div><span>Demandas abertas</span><strong>{openDemands.length}</strong><small>oportunidades registradas</small></div>
      <div><span>Ofertas em andamento</span><strong>{activeOffers.length}</strong><small>estruturação ou aprovação</small></div>
      <div><span>Contratos ativos</span><strong>{activeContracts.length}</strong><small>carteira formalizada</small></div>
      <div><span>Margem projetada</span><strong>{formatCurrency(String(margin))}</strong><small>contratos da carteira</small></div>
    </section>
    <div className="commercial-portfolio-actions">
      <Link className="tt-button" data-variant="secondary" data-size="md" href="/comercial/demandas">Nova demanda</Link>
      <Link className="tt-button" data-variant="primary" data-size="md" href="/ofertas/nova">Nova oferta</Link>
    </div>
    <div className="prototype-table-scroll"><table className="prototype-ledger">
      <thead><tr><th>Objeto</th><th>Referência</th><th>Contraparte</th><th>Commodity</th><th>Volume</th><th>Valor de referência</th><th>Etapa</th></tr></thead>
      <tbody>
        {openDemands.map((demand) => <ClickableTableRow key={`d-${demand.id}`} href={`/comercial/demandas/${demand.id}`} label={`Abrir demanda de ${demand.counterparty_name}`}>
          <td>Demanda</td><td className="prototype-id">DE-{demand.id.slice(-8).toUpperCase()}</td><td><strong>{demand.counterparty_name}</strong></td>
          <td>{commodityLabel(demand.commodity)}</td><td className="prototype-number">{formatQuantity(demand.quantity_sc)} sc</td>
          <td className="prototype-number">{demand.indicative_price_per_sc ? `${formatCurrency(demand.indicative_price_per_sc)}/sc` : 'A negociar'}</td>
          <td><span className="prototype-status" data-status="DRAFT">Prospecção</span></td>
        </ClickableTableRow>)}
        {activeOffers.map((offer) => <ClickableTableRow key={`o-${offer.id}`} href={`/ofertas/${offer.id}`} label={`Abrir oferta de ${offer.counterparty_name}`}>
          <td>Oferta</td><td className="prototype-id">OF-{offer.id.slice(-8).toUpperCase()}</td><td><strong>{offer.counterparty_name}</strong></td>
          <td>{commodityLabel(offer.commodity)}</td><td className="prototype-number">{formatQuantity(offer.quantity_sc)} sc</td>
          <td className="prototype-number">{formatCurrency(offer.purchase_price_per_sc)}/sc</td>
          <td><span className="prototype-status" data-status={offer.status}>{offerStatuses[offer.status] ?? offer.status}</span></td>
        </ClickableTableRow>)}
        {activeContracts.map((contract) => <ClickableTableRow key={`c-${contract.id}`} href={`/contratos/${contract.id}`} label={`Abrir contrato de ${contract.counterparty_name}`}>
          <td>Contrato</td><td className="prototype-id">{contract.external_number || `CT-${contract.id.slice(-8).toUpperCase()}`}</td><td><strong>{contract.counterparty_name}</strong></td>
          <td>{commodityLabel(contract.commodity)}</td><td className="prototype-number">{formatQuantity(contract.quantity_sc)} sc</td>
          <td className="prototype-number">{formatCurrency(contract.purchase_price_per_sc)}/sc</td>
          <td><span className="prototype-status" data-status={contract.status}>{contractStatusLabel(contract.status)}</span></td>
        </ClickableTableRow>)}
      </tbody>
    </table></div>
    {openDemands.length + activeOffers.length + activeContracts.length === 0
      ? <p className="prototype-empty">A carteira comercial ainda está vazia. <Link href="/comercial/demandas">Registrar a primeira demanda</Link></p>
      : null}
  </>;
}

export function CommercialConfirmationsView({ offers }: { offers: OfferPortfolio }) {
  const items = offers.items.filter((item) => ['IN_APPROVAL', 'APPROVED', 'CONVERTED'].includes(item.status));
  return <>
    <section className="contract-portfolio-metrics" aria-label="Resumo das confirmações">
      <div><span>Aguardando aprovação</span><strong>{items.filter((item) => item.status === 'IN_APPROVAL').length}</strong><small>dependem de decisão humana</small></div>
      <div><span>Confirmadas</span><strong>{items.filter((item) => item.status === 'APPROVED').length}</strong><small>prontas para formalização</small></div>
      <div><span>Convertidas</span><strong>{items.filter((item) => item.status === 'CONVERTED').length}</strong><small>contratos já criados</small></div>
    </section>
    <div className="prototype-table-scroll"><table className="prototype-ledger">
      <thead><tr><th>Oferta</th><th>Contraparte</th><th>Commodity</th><th>Volume</th><th>Preço</th><th>Margem / sc</th><th>Cenário</th><th>Confirmação</th></tr></thead>
      <tbody>{items.map((offer) => <ConfirmationRow key={offer.id} offer={offer} />)}</tbody>
    </table></div>
    {items.length === 0 ? <p className="prototype-empty">Nenhuma oferta está aguardando ou concluiu confirmação. <Link href="/">Ver ofertas</Link></p> : null}
  </>;
}

function ConfirmationRow({ offer }: { offer: OfferListItem }) {
  const href = offer.status === 'CONVERTED' && offer.contract_id
    ? `/contratos/${offer.contract_id}` : `/ofertas/${offer.id}`;
  const label = offer.status === 'IN_APPROVAL' ? 'Aguardando aprovação'
    : offer.status === 'APPROVED' ? 'Pronta para contrato' : 'Contrato criado';
  return <ClickableTableRow href={href} label={`Abrir confirmação da oferta de ${offer.counterparty_name}`}>
    <td className="prototype-id">OF-{offer.id.slice(-8).toUpperCase()}</td><td><strong>{offer.counterparty_name}</strong></td>
    <td>{commodityLabel(offer.commodity)}</td><td className="prototype-number">{formatQuantity(offer.quantity_sc)} sc</td>
    <td className="prototype-number">{formatCurrency(offer.purchase_price_per_sc)}/sc</td>
    <td className="prototype-number">{formatCurrency(offer.projected_margin_per_sc)}</td>
    <td>v{offer.scenario_version} · política v{offer.policy_version}</td>
    <td><span className="prototype-status" data-status={offer.status}>{label}</span></td>
  </ClickableTableRow>;
}
