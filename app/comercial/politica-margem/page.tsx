import { Button, DecimalField, Status } from '@mountier/tier-trade-design-system';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { publishMarginPolicy } from './actions';
import { PageFeedback } from '../../page-state';

type Policy = {
  commodity: 'MILHO' | 'SOJA'; version: number;
  autoApprovalMarginPerSc: string; absoluteFloorMarginPerSc: string;
};

async function loadPolicy(commodity: 'MILHO' | 'SOJA', headers: Record<string, string>): Promise<Policy | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(headers).length === 0) throw new Error('A API ou a identidade ainda não está configurada.');
  const response = await fetch(`${apiUrl}/v1/settings/margin-policy/${commodity}`, { headers, cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar a política de margem.');
  return await response.json() as Policy | null;
}

export default async function MarginPolicyPage({ searchParams }: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const user = await currentUserContext();
  const [query, policies] = await Promise.all([
    searchParams,
    Promise.all([loadPolicy('MILHO', user.identityHeaders), loadPolicy('SOJA', user.identityHeaders)])
      .catch(() => null),
  ]);
  const feedback = query.resultado === 'salvo' ? 'Nova versão publicada. As ofertas já calculadas preservam a versão aplicada.'
    : query.resultado === 'permissao' ? 'Seu usuário não possui permissão para alterar políticas de margem.'
      : query.resultado === 'invalido' ? 'Confira os valores. A margem automática não pode ficar abaixo do piso absoluto.'
        : query.resultado === 'indisponivel' ? 'A API não confirmou a publicação. Tente novamente.' : null;

  return (
    <AppShell activeDomain="commercial" userLabel={user.userLabel}>
      <div className="prototype-list-page">
        <header className="prototype-list-header"><div>
          <p className="prototype-breadcrumb">Comercial <span>›</span> Política de margem</p>
          <h1>Política de margem</h1>
          <p>Limites por commodity, versionados e aplicados aos cenários de preço da sua empresa.</p>
        </div></header>
        {feedback ? <PageFeedback title={query.resultado === 'salvo' ? 'Política publicada' : 'Não foi possível publicar'} message={feedback} tone={query.resultado === 'salvo' ? 'positive' : 'critical'} /> : null}
        {!policies ? <PageFeedback title="Não foi possível consultar a API" message="As políticas não foram alteradas." action={{ href: '/comercial/politica-margem', label: 'Tentar novamente' }} /> : null}
        {policies?.map((policy, index) => {
          const commodity = index === 0 ? 'MILHO' : 'SOJA';
          return <section key={commodity} className="policy-section">
            <div className="policy-intro">
              <p className="section-kicker">GOVERNANÇA COMERCIAL</p>
              <h2>{commodity === 'MILHO' ? 'Milho' : 'Soja'}</h2>
              <p>Uma publicação cria nova versão; cenários anteriores não são recalculados automaticamente.</p>
              {policy ? <Status tone="positive">Versão {policy.version} vigente</Status>
                : <Status tone="warning">Não configurada</Status>}
            </div>
            <form action={publishMarginPolicy} className="policy-form">
              <input type="hidden" name="commodity" value={commodity} />
              <DecimalField name="autoApprovalMarginPerSc" label="Margem para aprovação automática" prefix="R$" suffix="/sc" defaultValue={policy?.autoApprovalMarginPerSc ?? '0'} emptyWhenZero={!policy} required />
              <DecimalField name="absoluteFloorMarginPerSc" label="Piso absoluto de margem" prefix="R$" suffix="/sc" defaultValue={policy?.absoluteFloorMarginPerSc ?? '0'} emptyWhenZero={!policy} required />
              <div className="policy-actions"><span>O limite automático deve ser igual ou maior que o piso absoluto.</span><Button type="submit">{policy ? 'Publicar nova versão' : 'Publicar primeira política'}</Button></div>
            </form>
          </section>;
        })}
      </div>
    </AppShell>
  );
}
