import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { loadContracts } from '../../../lib/contracts';
import { loadDemands } from '../../../lib/demands';
import { loadOffers } from '../../../lib/offers';
import { CommercialPortfolioView } from '../commercial-portfolio-view';

export default async function CommercialPortfolioPage() {
  const user = await currentUserContext();
  const [offers, demands, contracts] = await Promise.all([
    loadOffers(user.identityHeaders), loadDemands(user.identityHeaders), loadContracts(user.identityHeaders),
  ]);
  const error = offers.error || demands.error || contracts.error;
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    <div className="prototype-list-page">
      <header className="prototype-list-header"><div>
        <p className="prototype-breadcrumb">Comercial <span>›</span> Carteira</p>
        <h1>Carteira comercial</h1>
        <p>Demandas, ofertas e contratos em uma única visão operacional</p>
      </div></header>
      {error ? <div className="feedback critical"><strong>Não foi possível carregar toda a carteira</strong><span>{error}</span></div> : null}
      {offers.data && demands.data && contracts.portfolio
        ? <CommercialPortfolioView offers={offers.data} demands={demands.data.items} contracts={contracts.portfolio} /> : null}
    </div>
  </AppShell>;
}
