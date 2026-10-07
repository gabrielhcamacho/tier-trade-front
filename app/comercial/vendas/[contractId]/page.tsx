import { Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../../../app-shell';
import { DetailNavigation } from '../../../detail-navigation';
import { DocumentPanel } from '../../../documents/document-panel';
import { currentUserContext } from '../../../../lib/current-user';
import { loadDocuments } from '../../../../lib/documents';
import { formatCurrency, formatDate, commodityLabel, contractStatusLabel } from '../../../../lib/contracts';
import { formatTonnes } from '../../../../lib/inventory';
import { loadSalesPortfolio } from '../../../../lib/sales';
import { SalesContractLifecycle } from '../sales-contract-lifecycle';
import { SalesContractAmendment } from '../sales-contract-amendment';

export default async function SalesContractDetailPage({ params }: {
  params: Promise<{ contractId: string }>;
}) {
  const [{ contractId }, user] = await Promise.all([params, currentUserContext()]);
  const [portfolio, documentResult] = await Promise.all([
    loadSalesPortfolio(user.identityHeaders),
    loadDocuments(user.identityHeaders, 'SALES_CONTRACT', contractId),
  ]);
  const contract = portfolio.data?.items.find((item) => item.id === contractId);
  return <AppShell activeDomain="commercial" userLabel={user.userLabel}>
    {!contract ? <><header className="page-header"><DetailNavigation backHref="/comercial/vendas" backLabel="Voltar às vendas" items={[{ label: 'Comercial' }, { label: 'Vendas', href: '/comercial/vendas' }, { label: 'Detalhe' }]} /><h1>Contrato de venda indisponível</h1></header><div className="feedback critical"><strong>Não foi possível abrir</strong><span>{portfolio.error ?? 'O contrato não foi encontrado.'}</span></div></> : <>
      <header className="entity-header">
        <DetailNavigation backHref="/comercial/vendas" backLabel="Voltar às vendas" items={[{ label: 'Comercial' }, { label: 'Vendas', href: '/comercial/vendas' }, { label: contract.reference, mono: true }]} />
        <div className="entity-title-row"><div><p className="entity-kind">Contrato de venda</p><h1>{contract.reference}</h1><p>{contract.counterparty_name}</p></div><div className="entity-actions"><Status tone={contract.status === 'ACTIVE' ? 'positive' : contract.status === 'CANCELLED' ? 'critical' : 'neutral'}>{contractStatusLabel(contract.status)}</Status><Link className="tt-button" data-variant="primary" data-size="md" href="/estoque">Abrir execução em estoque</Link></div></div>
        <dl className="entity-facts"><div><dt>Commodity</dt><dd>{commodityLabel(contract.commodity)}</dd></div><div><dt>Volume</dt><dd>{formatTonnes(contract.quantity_kg)} t</dd></div><div><dt>Preço</dt><dd>{formatCurrency(contract.sale_price_per_kg)} / kg</dd></div><div><dt>Janela</dt><dd>{formatDate(contract.delivery_start)} a {formatDate(contract.delivery_end)}</dd></div><div><dt>Expedido</dt><dd>{formatTonnes(contract.dispatched_kg)} t</dd></div></dl>
      </header>
      <div className="contract-detail-layout"><div className="contract-main-column">
        <section className="detail-section"><header><p className="section-kicker">EXECUÇÃO COMERCIAL</p><h2>Condições e progresso</h2></header><dl className="detail-data-grid"><div><dt>Destino</dt><dd>{contract.destination_code}</dd></div><div><dt>Alocado</dt><dd>{formatTonnes(contract.allocated_kg)} t</dd></div><div><dt>Prazo financeiro</dt><dd>{contract.payment_term_days === null ? 'A definir' : `${contract.payment_term_days} dias`}</dd></div><div><dt>Documentos exigidos</dt><dd>{contract.required_documents.join(', ') || 'Nenhum informado'}</dd></div></dl></section>
        <SalesContractLifecycle contractId={contract.id} status={contract.status} />
        <SalesContractAmendment contract={contract} counterparties={portfolio.data?.counterparties ?? []} />
        <DocumentPanel aggregateType="SALES_CONTRACT" aggregateId={contract.id} documents={documentResult.items} error={documentResult.error} returnPath={`/comercial/vendas/${contract.id}`} allowedDocumentTypes={['CONTRACT_DRAFT', 'SIGNED_CONTRACT', 'AMENDMENT', 'GUARANTEE', 'OTHER']} />
      </div><aside className="contract-side-column"><section><p className="section-kicker">RASTREABILIDADE</p><h2>Versão operacional preservada</h2><p>Documentos, alocações, expedições e previsões financeiras conservam a versão contratual usada quando foram registrados.</p></section></aside></div>
    </>}
  </AppShell>;
}
