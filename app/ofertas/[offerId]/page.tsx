import { AppShell } from '../../app-shell';
import { DetailNavigation } from '../../detail-navigation';
import { OfferWorkspace } from '../../offer-workspace';
import { currentUserContext } from '../../../lib/current-user';

export default async function OfferPage({ params }: { params: Promise<{ offerId: string }> }) {
  const [{ offerId }, { userLabel }] = await Promise.all([params, currentUserContext()]);

  return (
    <AppShell activeDomain="commercial" userLabel={userLabel}>
      <header className="page-header">
        <DetailNavigation backHref="/" backLabel="Voltar às ofertas" items={[{ label: 'Comercial', href: '/' }, { label: 'Ofertas', href: '/' }, { label: 'Detalhe' }]} />
        <div className="page-header-row">
          <div>
            <p className="entity-kind">Oferta de compra</p>
            <h1>Oferta registrada</h1>
            <p className="page-description">Condições, cálculo, aprovação e vínculo contratual persistidos no backend.</p>
          </div>
        </div>
      </header>
      <OfferWorkspace initialOfferId={offerId} />
    </AppShell>
  );
}
