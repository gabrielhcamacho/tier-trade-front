import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { commodityLabel, formatDate, loadOpenContractObligations, obligationStatus } from '../../../lib/contracts';
import { ClickableTableRow } from '../../clickable-table-row';
import { EmptyState, PageFeedback } from '../../page-state';

export default async function ObligationsPage() {
  const user = await currentUserContext();
  const result = await loadOpenContractObligations(user.identityHeaders);

  return (
    <AppShell activeDomain="contracts" userLabel={user.userLabel}>
      <div className="prototype-list-page">
        <header className="prototype-list-header">
          <div>
            <p className="prototype-breadcrumb">Contratos <span>›</span> Obrigações</p>
            <h1>Obrigações abertas</h1>
            <p>Compromissos contratuais pendentes ou em andamento, ordenados por prazo.</p>
          </div>
          <Link className="operational-link" href="/contratos">Ver contratos</Link>
        </header>
        {result.error ? <PageFeedback title="Não foi possível carregar as obrigações" message={result.error} action={{ href: '/contratos/obrigacoes', label: 'Tentar novamente' }} /> : null}
        {!result.error ? <>
          <div className="prototype-table-scroll"><table className="prototype-ledger">
            <thead><tr><th>Obrigação</th><th>Contrato</th><th>Contraparte</th><th>Commodity</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead>
            <tbody>{result.items.map((item) => <ClickableTableRow key={item.id} href={`/contratos/${item.contract_id}?from=obligations`} label={`Abrir obrigação ${item.title}`}>
              <td><strong>{item.title}</strong>{item.description ? <small>{item.description}</small> : null}</td>
              <td className="prototype-id">{item.contract_id.slice(-8).toUpperCase()}</td>
              <td>{item.counterparty_name}</td>
              <td>{commodityLabel(item.commodity)}</td>
              <td>{item.responsible_name ?? 'Não atribuído'}</td>
              <td>{item.due_date ? formatDate(item.due_date) : 'Sem prazo'}</td>
              <td>{obligationStatus(item.status)}</td>
            </ClickableTableRow>)}</tbody>
          </table></div>
          {result.items.length === 0 ? <EmptyState title="Não há obrigações contratuais abertas" description="Novos compromissos aparecerão aqui quando forem registrados nos contratos da empresa." action={{ href: '/contratos', label: 'Abrir contratos' }} /> : null}
          {result.hasMore ? <PageFeedback tone="info" title="A lista foi limitada" message="Exibindo as primeiras 100 obrigações. Refine a consulta enquanto a paginação completa não está disponível." /> : null}
        </> : null}
      </div>
    </AppShell>
  );
}
