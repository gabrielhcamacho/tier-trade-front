import { OfferWorkspace } from './offer-workspace';

export default function Page() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span>MT</span><strong>Tier Trade</strong></div>
        <nav aria-label="Principal">
          <a className="active" href="#nova-oferta">Compras</a>
          <span aria-disabled="true">Contratos</span>
          <span aria-disabled="true">Execução física</span>
          <span aria-disabled="true">Liquidação</span>
        </nav>
        <small>Primeira vertical slice</small>
      </aside>
      <main>
        <header className="topbar">
          <div><p>Comercial · Compras</p><h1>Nova oferta de milho</h1></div>
          <span className="environment">AMBIENTE LOCAL</span>
        </header>
        <OfferWorkspace />
      </main>
    </div>
  );
}
