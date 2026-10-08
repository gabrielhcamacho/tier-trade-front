import { AppShell } from '../../app-shell';
import { DetailNavigation } from '../../detail-navigation';
import { OfferWorkspace } from '../../offer-workspace';
import { currentUserContext } from '../../../lib/current-user';

export default async function Page() {
  const { userLabel } = await currentUserContext();

  return (
    <AppShell activeDomain="commercial" userLabel={userLabel}>
        <header className="page-header">
          <DetailNavigation backHref="/ofertas" backLabel="Voltar às ofertas" items={[{ label: 'Comercial', href: '/ofertas' }, { label: 'Ofertas', href: '/ofertas' }, { label: 'Nova oferta' }]} />
          <div className="page-header-row">
            <div>
              <p className="entity-kind">Oferta de compra</p>
              <h1>Nova oferta de milho</h1>
              <p className="page-description">Registre as condições, calcule a margem e conduza a aprovação até o contrato.</p>
            </div>
            <span className="environment-label">Mountier Agro · ambiente inicial</span>
          </div>
        </header>
        <OfferWorkspace />
    </AppShell>
  );
}
