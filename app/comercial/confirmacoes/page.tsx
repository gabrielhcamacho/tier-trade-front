import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { loadOffers } from '../../../lib/offers';
import { CommercialConfirmationsView } from '../commercial-portfolio-view';
import { PageFeedback } from '../../page-state';

export default async function CommercialConfirmationsPage() {
  const user = await currentUserContext();
  const result = await loadOffers(user.identityHeaders);
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    <div className="prototype-list-page">
      <header className="prototype-list-header"><div>
        <p className="prototype-breadcrumb">Comercial <span>›</span> Confirmações</p>
        <h1>Confirmações comerciais</h1>
        <p>Aprovação, aceite e conversão da oferta em contrato</p>
      </div></header>
      {result.error ? <PageFeedback title="Não foi possível carregar as confirmações" message={result.error} action={{ href: '/comercial/confirmacoes', label: 'Tentar novamente' }} /> : null}
      {result.data ? <CommercialConfirmationsView offers={result.data} /> : null}
    </div>
  </AppShell>;
}
