import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import { formatTonnes } from '../../../lib/inventory';
import { loadSalesPortfolio } from '../../../lib/sales';
import { commodityLabel, formatCurrency, formatDate } from '../../../lib/contracts';
import { SalesContractForm } from './sales-contract-form';
import { ClickableTableRow } from '../../clickable-table-row';
import { EmptyState, PageFeedback } from '../../page-state';

export default async function CommercialSalesPage() {
  const user = await currentUserContext();
  const result = await loadSalesPortfolio(user.identityHeaders);
  const contracts = result.data?.items ?? [];
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    <div className="prototype-list-page">
      <header className="prototype-list-header"><div>
        <p className="prototype-breadcrumb">Comercial <span>›</span> Vendas</p>
        <h1>Vendas</h1>
        <p>Condições de venda formalizadas · {contracts.length} {contracts.length === 1 ? 'contrato' : 'contratos'}</p>
      </div><Link className="prototype-new-button" href="/estoque">Abrir execução em estoque</Link></header>
      {result.error ? <PageFeedback title="Não foi possível carregar as vendas" message={result.error} action={{ href: '/comercial/vendas', label: 'Tentar novamente' }} /> : null}
      {result.data ? <>
        <div className="prototype-table-scroll"><table className="prototype-ledger">
          <thead><tr><th>Referência</th><th>Cliente</th><th>Commodity</th><th>Contratado</th><th>Alocado</th><th>Expedido</th><th>Preço</th><th>Janela</th><th>Status</th></tr></thead>
          <tbody>{contracts.map((item) => <ClickableTableRow key={item.id} href={`/comercial/vendas/${item.id}`} label={`Abrir contrato ${item.reference}`}>
            <td className="prototype-id">{item.reference}</td><td><strong>{item.counterparty_name}</strong></td>
            <td>{commodityLabel(item.commodity)}</td><td>{formatTonnes(item.quantity_kg)} t</td>
            <td>{formatTonnes(item.allocated_kg)} t</td><td>{formatTonnes(item.dispatched_kg)} t</td>
            <td>{formatCurrency(item.sale_price_per_kg)}/kg</td>
            <td>{formatDate(item.delivery_start)}–{formatDate(item.delivery_end)}</td>
            <td>{contractStatus(item.status)}</td>
          </ClickableTableRow>)}</tbody>
        </table></div>
        {contracts.length === 0 ? <EmptyState title="Nenhum contrato de venda registrado" description="Formalize uma venda para acompanhar alocação, expedição e liquidação a partir desta carteira." action={{ href: '/estoque', label: 'Abrir estoque e vendas' }} /> : null}
        <SalesContractForm contracts={contracts} counterparties={result.data.counterparties} />
      </> : null}
    </div>
  </AppShell>;
}

function contractStatus(value: string) {
  return ({ DRAFT: 'Rascunho', AWAITING_SIGNATURE: 'Aguardando assinatura', SIGNED: 'Assinado',
    ACTIVE: 'Ativo', CLOSED: 'Encerrado', CANCELLED: 'Cancelado' } as Record<string, string>)[value] ?? value;
}
