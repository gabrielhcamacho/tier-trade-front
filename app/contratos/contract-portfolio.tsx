import Link from 'next/link';
import { ClickableTableRow } from '../clickable-table-row';
import type { ContractPortfolio, ContractListItem } from '../../lib/contracts';
import { commodityLabel, contractStatusLabel, formatCurrency, formatDate, formatQuantity } from '../../lib/contracts';
import type { ContractPortfolioViewKey } from './page';

type Filters = { commodity?: string; status?: string; view?: string };

export function ContractPortfolioView({ portfolio, filters, view }: {
  portfolio: ContractPortfolio;
  filters: Filters;
  view: ContractPortfolioViewKey;
}) {
  const items = portfolio.items.filter((contract) =>
    (!filters.commodity || contract.commodity === filters.commodity) &&
    (!filters.status || contract.status === filters.status));
  const exportParams = new URLSearchParams();
  if (filters.commodity) exportParams.set('commodity', filters.commodity);
  if (filters.status) exportParams.set('status', filters.status);
  const exportHref = `/contratos/relatorio${exportParams.size ? `?${exportParams.toString()}` : ''}`;
  return (
    <>
      <ContractMetrics items={items} view={view} />
      <form className="prototype-filter-row" method="get" aria-label="Filtrar contratos">
        {view !== 'list' ? <input type="hidden" name="view" value={view} /> : null}
        <span><small>Tipo</small><strong>Compra</strong></span>
        <label><small>Commodity</small><select name="commodity" defaultValue={filters.commodity ?? ''}><option value="">Milho e soja</option><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></label>
        <label><small>Status</small><select name="status" defaultValue={filters.status ?? ''}><option value="">Todos</option><option value="DRAFT">Rascunho</option><option value="AWAITING_SIGNATURE">Aguardando assinatura</option><option value="SIGNED">Assinado</option><option value="ACTIVE">Ativo</option><option value="CLOSED">Encerrado</option></select></label>
        <button type="submit">Filtrar</button>
        <span className="prototype-filter-actions">
          {portfolio.tenant.legalName}
          <Link href={exportHref} prefetch={false}>Exportar relatório CSV</Link>
        </span>
      </form>
      <div className="prototype-table-scroll"><table className="prototype-ledger">
        <ContractTableHead view={view} />
        <tbody>{items.map((contract) => <ContractTableRow key={contract.id} contract={contract} view={view} />)}</tbody>
      </table></div>
      {items.length === 0 ? <p className="prototype-empty">Nenhum contrato corresponde aos filtros. <Link href={view === 'list' ? '/contratos' : `/contratos?view=${view}`}>Limpar filtros</Link></p> : null}
    </>
  );
}

function ContractMetrics({ items, view }: { items: ContractListItem[]; view: ContractPortfolioViewKey }) {
  const scheduledKg = items.reduce((sum, item) => sum + Number(item.scheduled_weight_kg), 0);
  const receivedKg = items.reduce((sum, item) => sum + Number(item.received_weight_kg), 0);
  const totalMargin = items.reduce((sum, item) => sum + Number(item.projected_margin_per_sc) * Number(item.quantity_sc), 0);
  const values: Record<ContractPortfolioViewKey, Array<[string, string, string]>> = {
    list: [
      ['Contratos', String(items.length), 'na carteira filtrada'],
      ['Volume contratado', `${formatQuantity(String(items.reduce((sum, item) => sum + Number(item.quantity_sc), 0)))} sc`, 'milho e soja'],
      ['Obrigações abertas', String(items.reduce((sum, item) => sum + item.pending_obligations, 0)), 'exigem acompanhamento'],
    ],
    deliveries: [
      ['Programado', `${formatQuantity(String(scheduledKg / 1000))} t`, `${items.reduce((sum, item) => sum + item.open_load_count, 0)} cargas abertas`],
      ['Recebido', `${formatQuantity(String(receivedKg / 1000))} t`, `${items.reduce((sum, item) => sum + item.received_load_count, 0)} cargas concluídas`],
      ['Saldo a programar', `${formatQuantity(String(items.reduce((sum, item) => sum + Number(item.available_weight_kg), 0) / 1000))} t`, 'respeita o saldo contratual'],
    ],
    economics: [
      ['Margem projetada', formatCurrency(String(totalMargin)), 'sobre a carteira filtrada'],
      ['Margem média', formatCurrency(String(weightedMargin(items))), 'por saca'],
      ['Contratos', String(items.length), 'com cenário preservado'],
    ],
    guarantees: [
      ['Garantias disponíveis', String(items.reduce((sum, item) => sum + item.guarantee_count, 0)), 'documentos anexados'],
      ['Contratos sem garantia', String(items.filter((item) => item.guarantee_count === 0).length), 'para acompanhamento'],
      ['Obrigações abertas', String(items.reduce((sum, item) => sum + item.pending_obligations, 0)), 'inclui pendências contratuais'],
    ],
    amendments: [
      ['Aditivos', String(items.reduce((sum, item) => sum + item.amendment_count, 0)), 'alterações formalizadas'],
      ['Contratos versionados', String(items.filter((item) => item.contract_version_number > 1).length), 'com histórico preservado'],
      ['Maior versão', `v${Math.max(1, ...items.map((item) => item.contract_version_number))}`, 'na carteira filtrada'],
    ],
    signatures: [
      ['Assinaturas concluídas', String(items.reduce((sum, item) => sum + item.signed_signature_count, 0)), 'registros auditados'],
      ['Assinaturas pendentes', String(items.reduce((sum, item) => sum + item.pending_signature_count, 0)), 'pendentes ou enviadas'],
      ['Instrumentos assinados', String(items.reduce((sum, item) => sum + item.signed_contract_count, 0)), 'documentos disponíveis'],
    ],
  };
  return <section className="contract-portfolio-metrics" aria-label="Resumo da carteira">
    {values[view].map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}
  </section>;
}

function ContractTableHead({ view }: { view: ContractPortfolioViewKey }) {
  const columns: Record<ContractPortfolioViewKey, string[]> = {
    list: ['Contrato', 'Tipo', 'Contraparte', 'Commodity', 'Volume', 'Executado', 'Preço', 'Status'],
    deliveries: ['Contrato', 'Contraparte', 'Janela', 'Programado', 'Recebido', 'Saldo', 'Cargas', 'Situação'],
    economics: ['Contrato', 'Contraparte', 'Volume', 'Compra / sc', 'Custos / sc', 'Margem / sc', 'Margem total', 'Versão'],
    guarantees: ['Contrato', 'Contraparte', 'Garantias', 'Documentos', 'Obrigações abertas', 'Versão', 'Situação'],
    amendments: ['Contrato', 'Contraparte', 'Versão atual', 'Aditivos', 'Última vigência', 'Situação'],
    signatures: ['Contrato', 'Contraparte', 'Instrumento', 'Assinadas', 'Pendentes', 'Documentos', 'Situação'],
  };
  return <thead><tr>{columns[view].map((column) => <th key={column}>{column}</th>)}</tr></thead>;
}

function ContractTableRow({ contract, view }: { contract: ContractListItem; view: ContractPortfolioViewKey }) {
  const href = contractHref(contract.id, view);
  const id = contract.external_number || `CT-${contract.id.slice(-8).toUpperCase()}`;
  if (view === 'deliveries') return <ClickableTableRow href={href} label={`Abrir entregas do contrato ${id}`}>
    <td className="prototype-id">{id}</td><td><strong>{contract.counterparty_name}</strong></td>
    <td>{formatDate(contract.delivery_start)} a {formatDate(contract.delivery_end)}</td>
    <td className="prototype-number">{formatMass(contract.scheduled_weight_kg)}</td>
    <td className="prototype-number">{formatMass(contract.received_weight_kg)}</td>
    <td className="prototype-number">{formatMass(contract.available_weight_kg)}</td>
    <td>{contract.received_load_count} concluída(s) · {contract.open_load_count} aberta(s)</td>
    <td><span className="prototype-status" data-status={contract.open_load_count > 0 ? 'ACTIVE' : contract.status}>{contract.open_load_count > 0 ? 'Em execução' : contractStatusLabel(contract.status)}</span></td>
  </ClickableTableRow>;
  if (view === 'economics') return <ClickableTableRow href={href} label={`Abrir custos e margem do contrato ${id}`}>
    <td className="prototype-id">{id}</td><td><strong>{contract.counterparty_name}</strong></td>
    <td className="prototype-number">{formatQuantity(contract.quantity_sc)} sc</td>
    <td className="prototype-number">{formatCurrency(contract.purchase_price_per_sc)}</td>
    <td className="prototype-number">{formatCurrency(contract.total_costs_per_sc)}</td>
    <td className="prototype-number">{formatCurrency(contract.projected_margin_per_sc)}</td>
    <td className="prototype-number">{formatCurrency(String(Number(contract.projected_margin_per_sc) * Number(contract.quantity_sc)))}</td>
    <td>v{contract.contract_version_number}</td>
  </ClickableTableRow>;
  if (view === 'guarantees') return <ClickableTableRow href={href} label={`Abrir garantias do contrato ${id}`}>
    <td className="prototype-id">{id}</td><td><strong>{contract.counterparty_name}</strong></td>
    <td>{contract.guarantee_count}</td><td>{contract.document_count}</td><td>{contract.pending_obligations}</td>
    <td>v{contract.contract_version_number}</td>
    <td><span className="prototype-status" data-status={contract.guarantee_count > 0 ? 'ACTIVE' : 'AWAITING_SIGNATURE'}>{contract.guarantee_count > 0 ? 'Com garantia' : 'Sem garantia anexada'}</span></td>
  </ClickableTableRow>;
  if (view === 'amendments') return <ClickableTableRow href={href} label={`Abrir aditivos do contrato ${id}`}>
    <td className="prototype-id">{id}</td><td><strong>{contract.counterparty_name}</strong></td>
    <td>v{contract.contract_version_number}</td><td>{contract.amendment_count}</td>
    <td>{contract.latest_amendment_on ? formatDate(contract.latest_amendment_on) : 'Sem aditivo'}</td>
    <td><span className="prototype-status" data-status={contract.status}>{contractStatusLabel(contract.status)}</span></td>
  </ClickableTableRow>;
  if (view === 'signatures') return <ClickableTableRow href={href} label={`Abrir assinaturas do contrato ${id}`}>
    <td className="prototype-id">{id}</td><td><strong>{contract.counterparty_name}</strong></td>
    <td>{contract.signed_contract_count > 0 ? 'Disponível' : 'Pendente'}</td><td>{contract.signed_signature_count}</td>
    <td>{contract.pending_signature_count}</td><td>{contract.document_count}</td>
    <td><span className="prototype-status" data-status={contract.signed_contract_count > 0 ? 'SIGNED' : contract.status}>{contract.signed_contract_count > 0 ? 'Formalizado' : contractStatusLabel(contract.status)}</span></td>
  </ClickableTableRow>;
  return <ClickableTableRow href={href} label={`Abrir contrato de ${contract.counterparty_name}`}>
    <td className="prototype-id">{id}</td>
    <td>Compra</td><td><strong>{contract.counterparty_name}</strong></td><td>{commodityLabel(contract.commodity)}</td>
    <td className="prototype-number">{formatQuantity(contract.quantity_sc)} sc</td>
    <td className="prototype-number">{formatQuantity(String(Number(contract.received_weight_kg) / 60))} sc</td>
    <td className="prototype-number">{formatCurrency(contract.purchase_price_per_sc)}/sc</td>
    <td><span className="prototype-status" data-status={contract.status}>{contractStatusLabel(contract.status)}</span>{contract.pending_obligations > 0 ? <small className="contract-pending-count">{contract.pending_obligations} obrigaç{contract.pending_obligations === 1 ? 'ão' : 'ões'} em aberto</small> : null}</td>
  </ClickableTableRow>;
}

function contractHref(id: string, view: ContractPortfolioViewKey): string {
  if (view === 'deliveries') return `/cargas?contractId=${id}`;
  if (view === 'economics') return `/contratos/${id}#custos-margem`;
  if (view === 'guarantees' || view === 'signatures') return `/contratos/${id}#documentos`;
  if (view === 'amendments') return `/contratos/${id}#termos-compra`;
  return `/contratos/${id}`;
}

function formatMass(value: string): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(value) / 1000)} t`;
}

function weightedMargin(items: ContractListItem[]): number {
  const volume = items.reduce((sum, item) => sum + Number(item.quantity_sc), 0);
  if (volume === 0) return 0;
  return items.reduce((sum, item) => sum + Number(item.projected_margin_per_sc) * Number(item.quantity_sc), 0) / volume;
}
