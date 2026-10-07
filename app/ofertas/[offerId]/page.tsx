import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { OfferWorkspace } from '../../offer-workspace';
import { currentUserContext } from '../../../lib/current-user';

export default async function OfferPage({ params }: { params: Promise<{ offerId: string }> }) {
  const [{ offerId }, { userLabel }] = await Promise.all([params, currentUserContext()]);

  return (
    <AppShell activeDomain="commercial" userLabel={userLabel}>
      <header className="page-header">
        <p className="breadcrumbs">Comercial <span>›</span> <Link href="/">Ofertas</Link> <span>›</span> Detalhe</p>
        <div className="page-header-row">
          <div>
            <p className="entity-kind">Oferta de compra</p>
            <h1>Oferta registrada</h1>
            <p className="page-description">Condições, cálculo, aprovação e vínculo contratual persistidos no backend.</p>
          </div>
          <Link className="operational-link" href="/">Voltar à lista</Link>
        </div>
      </header>
      <OfferWorkspace initialOfferId={offerId} />
    </AppShell>
  );
}
