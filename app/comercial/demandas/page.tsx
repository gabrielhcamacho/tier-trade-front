import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { formatCurrency, formatDate } from '../../../lib/contracts';
import { loadDemands } from '../../../lib/demands';
import { DemandForm } from './demand-form';

export default async function DemandsPage() {
  const user = await currentUserContext();
  const result = await loadDemands(user.identityHeaders);
  const items = result.data?.items ?? [];
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    <div className="prototype-list-page">
      <header className="prototype-list-header"><div><p className="prototype-breadcrumb">Comercial <span>›</span> Demandas</p>
        <h1>Demandas</h1><p>Intenções preliminares de compra e venda, antes de oferta ou contrato.</p></div></header>
      {result.error ? <div className="feedback critical" role="alert">{result.error}</div> : null}
      {result.data ? <>
        <div className="prototype-table-scroll"><table className="prototype-ledger"><thead><tr>
          <th>Contraparte</th><th>Operação</th><th>Commodity</th><th>Volume</th><th>Preço indicativo</th><th>Entrega</th><th>Interações</th><th>Situação</th><th></th>
        </tr></thead><tbody>{items.map((item) => <tr key={item.id}>
          <td><strong>{item.counterparty_name}</strong></td><td>{item.direction === 'PURCHASE' ? 'Compra' : 'Venda'}</td>
          <td>{item.commodity === 'MILHO' ? 'Milho' : 'Soja'}</td><td>{Number(item.quantity_sc).toLocaleString('pt-BR')} sc</td>
          <td>{item.indicative_price_per_sc ? `${formatCurrency(item.indicative_price_per_sc)}/sc` : 'Não informado'}</td>
          <td>{formatDate(item.delivery_start)}–{formatDate(item.delivery_end)}</td><td>{item.negotiation_count ?? 0}</td>
          <td>{item.status === 'OPEN' ? 'Aberta' : 'Encerrada'}</td><td><Link href={`/comercial/demandas/${item.id}`}>Abrir →</Link></td>
        </tr>)}</tbody></table></div>
        {items.length === 0 ? <p className="prototype-empty">Nenhuma demanda registrada para esta empresa.</p> : null}
        {result.data.hasMore ? <p className="prototype-empty">Existem mais de 500 demandas. A paginação é uma etapa pendente.</p> : null}
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
