import { redirect } from 'next/navigation';
import { signOut } from './auth/actions';
import { OfferWorkspace } from './offer-workspace';
import { createClient } from '../lib/supabase/server';
import { hasSupabaseConfiguration } from '../lib/supabase/configuration';

export default async function Page() {
  let userLabel = 'Identidade local';
  if (hasSupabaseConfiguration()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims.sub) redirect('/login');
    userLabel = typeof data.claims.email === 'string' ? data.claims.email : 'Usuário autenticado';
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <header className="domain-bar">
        <a className="wordmark" href="#conteudo" aria-label="Mountier Agro Trading, início">
          <span className="wordmark-mark" aria-hidden="true">M</span>
          <strong>Mountier Agro</strong>
          <em>Trading</em>
        </a>
        <nav aria-label="Domínios">
          <span aria-disabled="true">Central</span>
          <a className="active" href="#nova-oferta">Comercial</a>
          <span aria-disabled="true">Contratos</span>
          <span aria-disabled="true">Operações</span>
          <span aria-disabled="true">Estoque</span>
          <span aria-disabled="true">Risco</span>
        </nav>
        <div className="user-menu">
          <span className="user-avatar" aria-hidden="true">{userLabel.slice(0, 1).toUpperCase()}</span>
          <span className="user-label">{userLabel}</span>
          {hasSupabaseConfiguration() ? (
            <form action={signOut}><button type="submit">Sair</button></form>
          ) : null}
        </div>
      </header>

      <nav className="context-bar" aria-label="Comercial">
        <a className="active" href="#nova-oferta">Ofertas</a>
        <a href="#politica-margem">Política de margem</a>
        <span aria-disabled="true">Negociações</span>
        <span aria-disabled="true">Formação de preço</span>
        <span aria-disabled="true">Confirmações</span>
      </nav>

      <main id="conteudo">
        <header className="page-header">
          <p className="breadcrumbs">Comercial <span>›</span> Ofertas <span>›</span> Nova oferta</p>
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
      </main>
    </div>
  );
}
