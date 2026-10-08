import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { loadDemands } from '../../../lib/demands';
import { ClickableTableRow } from '../../clickable-table-row';
import { EmptyState, PageFeedback } from '../../page-state';

export default async function NegotiationsPage() {
  const user = await currentUserContext();
  const result = await loadDemands(user.identityHeaders);
  const items = [...(result.data?.items ?? [])].filter((item) => item.negotiation_count || item.status === 'OPEN')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    <div className="prototype-list-page">
      <header className="prototype-list-header"><div><p className="prototype-breadcrumb">Comercial <span>›</span> Negociações</p>
        <h1>Negociações</h1><p>Acompanhe conversas ligadas às demandas da sua empresa, sem misturar propostas com contratos.</p>
      </div><Link href="/comercial/demandas" className="prototype-new-button">Todas as demandas</Link></header>
      {result.error ? <PageFeedback title="Não foi possível carregar as negociações" message={result.error} action={{ href: '/comercial/negociacoes', label: 'Tentar novamente' }} /> : null}
      {result.data ? <><div className="prototype-table-scroll"><table className="prototype-ledger"><thead><tr>
        <th>Contraparte</th><th>Operação</th><th>Commodity</th><th>Interações</th><th>Situação</th><th>Última atualização</th>
      </tr></thead><tbody>{items.map((item) => <ClickableTableRow key={item.id} href={`/comercial/demandas/${item.id}`} label={`Abrir histórico de ${item.counterparty_name}`}>
        <td><strong>{item.counterparty_name}</strong></td><td>{item.direction === 'PURCHASE' ? 'Compra' : 'Venda'}</td>
        <td>{item.commodity === 'MILHO' ? 'Milho' : 'Soja'}</td><td>{item.negotiation_count ?? 0}</td>
        <td>{item.status === 'OPEN' ? 'Aberta' : 'Encerrada'}</td>
        <td><time dateTime={item.updated_at}>{new Date(item.updated_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</time></td>
      </ClickableTableRow>)}</tbody></table></div>
      {items.length === 0 ? <EmptyState title="Nenhuma negociação em andamento" description="Abra uma demanda e registre a primeira interação para iniciar o histórico comercial." action={{ href: '/comercial/demandas', label: 'Abrir demandas' }} /> : null}
      {result.data.hasMore ? <PageFeedback tone="info" title="A lista foi limitada" message="O limite de 500 registros foi alcançado. Refine a consulta enquanto a paginação completa não está disponível." /> : null}
      </> : null}
    </div>
  </AppShell>;
}
