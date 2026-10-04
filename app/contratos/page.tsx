import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadContracts } from '../../lib/contracts';
import { AppShell } from '../app-shell';
import { ContractPortfolioView } from './contract-portfolio';

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ commodity?: string; status?: string }> }) {
  const user = await currentUserContext();
  const [result, filters] = await Promise.all([loadContracts(user.identityHeaders), searchParams]);
  const count = result.portfolio?.items.length;

  return (
    <AppShell activeDomain="contracts" userLabel={user.userLabel}>
      <div className="prototype-list-page">
        <header className="prototype-list-header"><div>
          <p className="prototype-breadcrumb">Contratos <span>›</span> Lista</p>
          <h1>Contratos</h1>
          <p>Compra · milho e soja · {count === undefined ? 'dados indisponíveis' : `${count} ${count === 1 ? 'contrato' : 'contratos'} na carteira`}</p>
        </div></header>
        {result.error ? <ContractPortfolioError message={result.error} /> : null}
        {result.portfolio?.items.length === 0 ? <EmptyPortfolio isDemo={result.portfolio.tenant.isDemo} /> : null}
        {result.portfolio && result.portfolio.items.length > 0
          ? <ContractPortfolioView portfolio={result.portfolio} filters={filters} />
          : null}
      </div>
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
      <Link className="tt-button" data-variant="primary" data-size="md" href="/ofertas/nova">Criar oferta</Link>
    </section>
  );
}
