import { OfferWorkspace } from './offer-workspace';
import { redirect } from 'next/navigation';
import { signOut } from './auth/actions';
import { hasSupabaseConfiguration } from '../lib/supabase/configuration';
import { createClient } from '../lib/supabase/server';

export default async function Page() {
  let userLabel = 'Identidade local';
  if (hasSupabaseConfiguration()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims.sub) redirect('/login');
    userLabel = typeof data.claims.email === 'string' ? data.claims.email : 'Usuário autenticado';
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span>MT</span><strong>Tier Trade</strong></div>
        <nav aria-label="Principal">
          <a className="active" href="#nova-oferta">Compras</a>
          <a href="#politica-margem">Política de margem</a>
          <span aria-disabled="true">Contratos</span>
          <span aria-disabled="true">Execução física</span>
          <span aria-disabled="true">Liquidação</span>
        </nav>
        <small>Primeira vertical slice</small>
      </aside>
      <main>
        <header className="topbar">
          <div><p>Comercial · Compras</p><h1>Nova oferta de milho</h1></div>
          <div className="session"><span>{userLabel}</span>{hasSupabaseConfiguration()
            ? <form action={signOut}><button type="submit" className="text-button">Sair</button></form>
            : null}</div>
        </header>
        <OfferWorkspace />
      </main>
    </div>
  );
}
