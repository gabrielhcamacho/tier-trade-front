import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { commodityLabel, formatDate, loadOpenContractObligations, obligationStatus } from '../../../lib/contracts';

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
        {result.error ? <div className="feedback critical" role="alert"><strong>Não foi possível carregar</strong><span>{result.error}</span></div> : null}
        {!result.error ? <>
          <div className="prototype-table-scroll"><table className="prototype-ledger">
            <thead><tr><th>Obrigação</th><th>Contrato</th><th>Contraparte</th><th>Commodity</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>{result.items.map((item) => <tr key={item.id}>
              <td><strong>{item.title}</strong>{item.description ? <small>{item.description}</small> : null}</td>
              <td className="prototype-id">{item.contract_id.slice(-8).toUpperCase()}</td>
              <td>{item.counterparty_name}</td>
              <td>{commodityLabel(item.commodity)}</td>
              <td>{item.responsible_name ?? 'Não atribuído'}</td>
              <td>{item.due_date ? formatDate(item.due_date) : 'Sem prazo'}</td>
              <td>{obligationStatus(item.status)}</td>
              <td><Link href={`/contratos/${item.contract_id}#obrigacoes`}>Abrir</Link></td>
            </tr>)}</tbody>
          </table></div>
          {result.items.length === 0 ? <p className="prototype-empty">Não há obrigações contratuais abertas neste tenant.</p> : null}
          {result.hasMore ? <p className="prototype-empty">Exibindo as primeiras 100 obrigações. A paginação completa ainda não está disponível.</p> : null}
        </> : null}
      </div>
    </AppShell>
  );
}
