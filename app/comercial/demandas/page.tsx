import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { formatCurrency, formatDate } from '../../../lib/contracts';
import { loadDemands } from '../../../lib/demands';
import { DemandForm } from './demand-form';
import { ClickableTableRow } from '../../clickable-table-row';
import { EmptyState, PageFeedback } from '../../page-state';

export default async function DemandsPage() {
  const user = await currentUserContext();
  const result = await loadDemands(user.identityHeaders);
  const items = result.data?.items ?? [];
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    <div className="prototype-list-page">
      <header className="prototype-list-header"><div><p className="prototype-breadcrumb">Comercial <span>›</span> Demandas</p>
        <h1>Demandas</h1><p>Intenções preliminares de compra e venda, antes de oferta ou contrato.</p></div></header>
      {result.error ? <PageFeedback title="Não foi possível carregar as demandas" message={result.error} action={{ href: '/comercial/demandas', label: 'Tentar novamente' }} /> : null}
      {result.data ? <>
        <div className="prototype-table-scroll"><table className="prototype-ledger"><thead><tr>
          <th>Contraparte</th><th>Operação</th><th>Commodity</th><th>Volume</th><th>Preço indicativo</th><th>Entrega</th><th>Interações</th><th>Situação</th>
        </tr></thead><tbody>{items.map((item) => <ClickableTableRow key={item.id} href={`/comercial/demandas/${item.id}`} label={`Abrir demanda de ${item.counterparty_name}`}>
          <td><strong>{item.counterparty_name}</strong></td><td>{item.direction === 'PURCHASE' ? 'Compra' : 'Venda'}</td>
          <td>{item.commodity === 'MILHO' ? 'Milho' : 'Soja'}</td><td>{Number(item.quantity_sc).toLocaleString('pt-BR')} sc</td>
          <td>{item.indicative_price_per_sc ? `${formatCurrency(item.indicative_price_per_sc)}/sc` : 'Não informado'}</td>
          <td>{formatDate(item.delivery_start)}–{formatDate(item.delivery_end)}</td><td>{item.negotiation_count ?? 0}</td>
          <td>{item.status === 'OPEN' ? 'Aberta' : 'Encerrada'}</td>
        </ClickableTableRow>)}</tbody></table></div>
        {items.length === 0 ? <EmptyState compact title="Nenhuma demanda registrada" description="Use o formulário abaixo para registrar uma intenção comercial sem criar oferta ou obrigação financeira." /> : null}
        {result.data.hasMore ? <PageFeedback tone="info" title="A lista foi limitada" message="Existem mais de 500 demandas. Refine a consulta enquanto a paginação completa não está disponível." /> : null}
        <section className="commercial-demand-section"><p className="section-kicker">NOVA DEMANDA</p><h2>Registrar intenção comercial</h2>
          <p>O preço é apenas indicativo. Este registro não calcula margem nem cria obrigação financeira.</p>
          {result.data.counterparties.some((item) => item.party_type === 'UNCLASSIFIED') ? <p>
            Contrapartes com perfil pendente precisam ser classificadas antes do uso. Confirme o perfil em <Link href="/ofertas/nova">Nova oferta › Contraparte</Link>; não é necessário criar uma oferta.
          </p> : null}
          <DemandForm counterparties={result.data.counterparties} /></section>
      </> : null}
    </div>
  </AppShell>;
}
