import Link from 'next/link';
import type { ContractPortfolio } from '../../lib/contracts';
import { commodityLabel, contractStatusLabel, formatCurrency, formatQuantity } from '../../lib/contracts';

export function ContractPortfolioView({ portfolio, filters }: { portfolio: ContractPortfolio; filters: { commodity?: string; status?: string } }) {
  const items = portfolio.items.filter((contract) =>
    (!filters.commodity || contract.commodity === filters.commodity) &&
    (!filters.status || contract.status === filters.status));
  return (
    <>
      <form className="prototype-filter-row" method="get" aria-label="Filtrar contratos">
        <span><small>Tipo</small><strong>Compra</strong></span>
        <label><small>Commodity</small><select name="commodity" defaultValue={filters.commodity ?? ''}><option value="">Milho e soja</option><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></label>
        <label><small>Status</small><select name="status" defaultValue={filters.status ?? ''}><option value="">Todos</option><option value="ACTIVE">Ativo</option></select></label>
        <button type="submit">Filtrar</button>
        <span className="prototype-filter-actions">{portfolio.tenant.legalName}</span>
      </form>
      <div className="prototype-table-scroll"><table className="prototype-ledger">
        <thead><tr><th>Contrato</th><th>Tipo</th><th>Contraparte</th><th>Commodity</th><th>Volume</th><th>Executado</th><th>Preço</th><th>Status</th><th></th></tr></thead>
        <tbody>{items.map((contract) => <tr key={contract.id}>
          <td className="prototype-id">CT-{contract.id.slice(-8).toUpperCase()}</td>
          <td>Compra</td>
          <td><strong>{contract.counterparty_name}</strong></td>
          <td>{commodityLabel(contract.commodity)}</td>
          <td className="prototype-number">{formatQuantity(contract.quantity_sc)} sc</td>
          <td className="prototype-number">{formatQuantity(String(Number(contract.received_weight_kg) / 60))} sc</td>
          <td className="prototype-number">{formatCurrency(contract.purchase_price_per_sc)}/sc</td>
          <td><span className="prototype-status" data-status={contract.status}>{contractStatusLabel(contract.status)}</span>{contract.pending_obligations > 0 ? <small className="contract-pending-count">{contract.pending_obligations} obrigaç{contract.pending_obligations === 1 ? 'ão' : 'ões'} em aberto</small> : null}</td>
          <td><Link href={`/contratos/${contract.id}`}>Abrir →</Link></td>
        </tr>)}</tbody>
      </table></div>
      {items.length === 0 ? <p className="prototype-empty">Nenhum contrato corresponde aos filtros. <Link href="/contratos">Limpar filtros</Link></p> : null}
    </>
  );
}
