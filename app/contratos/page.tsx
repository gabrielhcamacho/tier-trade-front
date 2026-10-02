import Link from 'next/link';
import { AppShell } from '../app-shell';
import { currentUserContext } from '../../lib/current-user';

export default async function ContractsPage() {
  const user = await currentUserContext();

  return (
    <AppShell activeDomain="contracts" userLabel={user.userLabel}>
      <header className="page-header">
        <p className="breadcrumbs">Contratos <span>›</span> Visão geral</p>
        <div className="page-header-row">
          <div>
            <p className="entity-kind">Gestão contratual</p>
            <h1>Contratos</h1>
            <p className="page-description">Acompanhe as condições formalizadas, obrigações e o início da execução física.</p>
          </div>
          <span className="environment-label">Mountier Agro · ambiente inicial</span>
        </div>
      </header>

      <section className="loads-empty-state" aria-labelledby="contracts-empty-title">
        <span className="loads-empty-mark" aria-hidden="true">CT</span>
        <p className="section-kicker">ORIGEM COMERCIAL</p>
        <h2 id="contracts-empty-title">Abra um contrato a partir da oferta convertida</h2>
        <p>A listagem de contratos será conectada na próxima evolução do backend. Por enquanto, o contrato real fica disponível ao final do fluxo comercial.</p>
        <Link className="tt-button" data-variant="primary" data-size="md" href="/">Ir para ofertas</Link>
      </section>
    </AppShell>
  );
}
