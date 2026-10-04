import Link from 'next/link';
import { AppShell } from './app-shell';
import { currentUserContext } from '../lib/current-user';
import { loadOffers } from '../lib/offers';
import { commodityLabel, formatCurrency, formatQuantity } from '../lib/contracts';

const statuses: Record<string, string> = {
  DRAFT: 'Rascunho', IN_APPROVAL: 'Aguardando aprovação',
  APPROVED: 'Aprovada', CONVERTED: 'Contratada', CANCELLED: 'Cancelada',
};

export default async function CommercialPage({ searchParams }: { searchParams: Promise<{ commodity?: string; status?: string }> }) {
  const user = await currentUserContext();
  const [result, filters] = await Promise.all([loadOffers(user.identityHeaders), searchParams]);
  const allItems = result.data?.items ?? [];
  const items = allItems.filter((offer) =>
    (!filters.commodity || offer.commodity === filters.commodity) &&
    (!filters.status || offer.status === filters.status));

  return (
    <AppShell activeDomain="commercial" userLabel={user.userLabel}>
      <div className="prototype-list-page">
        <header className="prototype-list-header">
          <div>
            <p className="prototype-breadcrumb">Comercial <span>›</span> Ofertas</p>
            <h1>Ofertas</h1>
            <p>Milho e soja · {result.error ? 'dados indisponíveis' : `${allItems.length} ${allItems.length === 1 ? 'oferta cadastrada' : 'ofertas cadastradas'}`}</p>
          </div>
          <Link className="prototype-new-button" href="/ofertas/nova"><span aria-hidden="true">＋</span> Nova oferta</Link>
        </header>
        {result.error ? <div className="feedback critical"><strong>Não foi possível carregar</strong><span>{result.error}</span></div> : null}
        {result.data ? <>
          <form className="prototype-filter-row" method="get" aria-label="Filtrar ofertas">
            <label><small>Commodity</small><select name="commodity" defaultValue={filters.commodity ?? ''}><option value="">Milho e soja</option><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></label>
            <label><small>Status</small><select name="status" defaultValue={filters.status ?? ''}><option value="">Todos</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button type="submit">Filtrar</button>
            <span className="prototype-filter-actions">Dados da sua empresa</span>
          </form>
          <div className="prototype-table-scroll"><table className="prototype-ledger">
            <thead><tr><th>Oferta</th><th>Contraparte</th><th>Commodity</th><th>Volume</th><th>Preço pedido</th><th>Recebida</th><th>Status</th></tr></thead>
            <tbody>{items.map((offer) => <tr key={offer.id}>
              <td className="prototype-id">OF-{offer.id.slice(-8).toUpperCase()}</td>
              <td><strong>{offer.counterparty_name}</strong></td>
              <td>{commodityLabel(offer.commodity)}</td>
              <td className="prototype-number">{formatQuantity(offer.quantity_sc)} sc</td>
              <td className="prototype-number">{formatCurrency(offer.purchase_price_per_sc)}/sc</td>
              <td>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(offer.created_at))}</td>
              <td><span className="prototype-status" data-status={offer.status}>{statuses[offer.status] ?? offer.status}</span></td>
            </tr>)}</tbody>
          </table></div>
          {items.length === 0 ? <p className="prototype-empty">{allItems.length === 0 ? 'Ainda não há ofertas neste tenant.' : 'Nenhuma oferta corresponde aos filtros.'} <Link href={allItems.length === 0 ? '/ofertas/nova' : '/'}>{allItems.length === 0 ? 'Criar a primeira oferta' : 'Limpar filtros'}</Link></p> : null}
        </> : null}
      </div>
    </AppShell>
  );
}
