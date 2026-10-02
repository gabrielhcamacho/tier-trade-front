import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadContracts } from '../../lib/contracts';
import { AppShell } from '../app-shell';
import { ContractPortfolioView } from './contract-portfolio';

export default async function ContractsPage() {
  const user = await currentUserContext();
  const result = await loadContracts(user.identityHeaders);
  const tenantName = result.portfolio?.tenant.legalName ?? 'Ambiente autenticado';

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
          <span className="environment-label">{tenantName}</span>
        </div>
      </header>

      {result.error ? <ContractPortfolioError message={result.error} /> : null}
      {result.portfolio?.items.length === 0 ? <EmptyPortfolio isDemo={result.portfolio.tenant.isDemo} /> : null}
      {result.portfolio && result.portfolio.items.length > 0
        ? <ContractPortfolioView portfolio={result.portfolio} />
        : null}
    </AppShell>
  );
}

function ContractPortfolioError({ message }: { message: string }) {
  return (
    <section className="loads-empty-state" aria-labelledby="contracts-error-title">
      <span className="loads-empty-mark" aria-hidden="true">!</span>
      <p className="section-kicker">CONEXÃO COM A API</p>
      <h2 id="contracts-error-title">Não foi possível carregar os contratos</h2>
      <p>{message}</p>
      <Link className="tt-button" data-variant="primary" data-size="md" href="/contratos">Tentar novamente</Link>
    </section>
  );
}

function EmptyPortfolio({ isDemo }: { isDemo: boolean }) {
  return (
    <section className="loads-empty-state" aria-labelledby="contracts-empty-title">
      <span className="loads-empty-mark" aria-hidden="true">CT</span>
      <p className="section-kicker">ORIGEM COMERCIAL</p>
      <h2 id="contracts-empty-title">Ainda não há contratos neste tenant</h2>
      <p>{isDemo
        ? 'O tenant demonstrativo está vazio. Crie e aprove uma oferta para iniciar a carteira real de demonstração.'
        : 'Crie e aprove uma oferta para convertê-la em contrato e iniciar a execução.'}</p>
      <Link className="tt-button" data-variant="primary" data-size="md" href="/#nova-oferta">Criar oferta</Link>
    </section>
  );
}
