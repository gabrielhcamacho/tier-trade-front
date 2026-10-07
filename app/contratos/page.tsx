import Link from 'next/link';
import { currentUserContext } from '../../lib/current-user';
import { loadContracts } from '../../lib/contracts';
import { AppShell } from '../app-shell';
import { ContractPortfolioView } from './contract-portfolio';

const views = {
  list: { section: 'Lista', title: 'Contratos', description: 'Compra · milho e soja' },
  deliveries: { section: 'Entregas', title: 'Entregas contratuais', description: 'Programação, recebimento e saldo por contrato' },
  economics: { section: 'Custos e margem', title: 'Custos e margem', description: 'Economia contratada e projeção de resultado' },
  guarantees: { section: 'Garantias', title: 'Garantias contratuais', description: 'Documentos e pendências de garantia' },
  amendments: { section: 'Aditivos', title: 'Aditivos contratuais', description: 'Versões e alterações formalizadas' },
  signatures: { section: 'Assinaturas', title: 'Assinaturas', description: 'Formalização e assinaturas dos instrumentos' },
} as const;

export type ContractPortfolioViewKey = keyof typeof views;

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ commodity?: string; status?: string; view?: string }> }) {
  const user = await currentUserContext();
  const [result, filters] = await Promise.all([loadContracts(user.identityHeaders), searchParams]);
  const view = filters.view && filters.view in views ? filters.view as ContractPortfolioViewKey : 'list';
  const page = views[view];
  const count = result.portfolio?.items.length;

  return (
    <AppShell activeDomain="contracts" userLabel={user.userLabel}>
      <div className="prototype-list-page">
        <header className="prototype-list-header"><div>
          <p className="prototype-breadcrumb">Contratos <span>›</span> {page.section}</p>
          <h1>{page.title}</h1>
          <p>{page.description} · {count === undefined ? 'dados indisponíveis' : `${count} ${count === 1 ? 'contrato' : 'contratos'} na carteira`}</p>
        </div></header>
        {result.error ? <ContractPortfolioError message={result.error} /> : null}
        {result.portfolio?.items.length === 0 ? <EmptyPortfolio isDemo={result.portfolio.tenant.isDemo} /> : null}
        {result.portfolio && result.portfolio.items.length > 0
          ? <ContractPortfolioView portfolio={result.portfolio} filters={filters} view={view} />
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
