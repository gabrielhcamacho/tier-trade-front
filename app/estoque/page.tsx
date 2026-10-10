import Link from 'next/link';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { currentUserContext } from '../../lib/current-user';
import {
  formatInventoryDate,
  formatTonnes,
  loadInventory,
  movementLabel,
  type InventoryLot,
  type InventoryPosition,
} from '../../lib/inventory';
import { FulfillmentForms } from './fulfillment-forms';
import { InventoryGovernanceForms } from './inventory-governance-forms';
import { EmptyState, PageFeedback } from '../page-state';
import { ReportFilterBar } from '../report-filter-bar';

const views = {
  overview: ['Posição', 'Custódia e disponibilidade', 'Posição de estoque'],
  lots: ['Lotes', 'Rastreabilidade física', 'Lotes de estoque'],
  movements: ['Movimentos', 'Livro imutável', 'Movimentos de estoque'],
  reconciliation: ['Reconciliação', 'Integridade do saldo', 'Reconciliação de estoque'],
} as const;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const requestedView = (await searchParams).view;
  const view = requestedView && requestedView in views ? requestedView as keyof typeof views : 'overview';
  const [section, eyebrow, title] = views[view];
  const user = await currentUserContext();
  const result = await loadInventory(user.identityHeaders);

  return (
    <AppShell activeDomain="inventory" userLabel={user.userLabel}>
      <DemoPageHeader
        domain="Estoque"
        section={section}
        eyebrow={eyebrow}
        title={title}
        description="Saldo físico rastreado por recebimento, lote e localização."
        scope="Fonte: livro imutável de movimentos"
      />
      <div className="demo-page demo-workspace module-view" data-workspace-view={view}>
        <ReportFilterBar action="/estoque/relatorio" defaultType="lotes" types={[{ value: 'lotes', label: 'Lotes' }, { value: 'movimentos', label: 'Movimentos' }, { value: 'vendas', label: 'Vendas' }]} />
        {result.data
          ? <InventoryWorkspace data={result.data} />
          : <InventoryError message={result.error} />}
      </div>
    </AppShell>
  );
}

function InventoryError({ message }: { message: string }) {
  return <PageFeedback title="Não foi possível carregar a posição de estoque" message={message} action={{ href: '/estoque', label: 'Tentar novamente' }} />;
}

function InventoryWorkspace({ data }: { data: InventoryPosition }) {
  const locationCount = new Set(data.lots.map((lot) => lot.location.code)).size;
  const commodityCount = new Set(data.lots.map((lot) => lot.commodity)).size;
  const positionRows = data.lots.map((lot) => [
    `${lot.location.name} · ${lot.location.code}`,
    lot.lotCode,
    `v${lot.contractVersionNumber}`,
    commodityLabel(lot.commodity),
    ownershipLabel(lot.ownershipStatus),
    `${formatTonnes(lot.quantityKg)} t`,
    custodyLabel(lot.custodyStatus),
    lot.status === 'AVAILABLE' ? `${formatTonnes(lot.availableKg)} t` : '0,000 t',
    <DemoStatus tone={lot.status === 'AVAILABLE' ? 'positive' : 'attention'} key={lot.id}>
      {lot.status === 'AVAILABLE' ? 'Disponível' : 'Em revisão'}
    </DemoStatus>,
  ]);
  const movementRows = data.movements.map((movement) => [
    formatInventoryDate(movement.recordedAt),
    movementLabel(movement.type),
    movement.sourceLoadId
      ? <Link href={`/cargas/${movement.sourceLoadId}`} key={movement.id}>{movement.sourceLoadId.slice(0, 8).toUpperCase()}</Link>
      : 'Expedição',
    movement.lotCode,
    `${Number(movement.quantityDeltaKg) >= 0 ? '+' : '−'} ${formatTonnes(String(Math.abs(Number(movement.quantityDeltaKg))))} t`,
    movement.sourceReceiptId
      ? `Recebimento ${movement.sourceReceiptId.slice(0, 8).toUpperCase()}`
      : `Alocação ${movement.allocationId?.slice(0, 8).toUpperCase()}`,
  ]);

  return (
    <>
      {data.tenant.isDemo ? <DemoNotice persisted /> : null}
      <DemoMetricStrip items={[
        { label: 'Estoque físico', value: formatTonnes(data.summary.physicalWeightKg), unit: 't', detail: 'saldo do livro de movimentos' },
        { label: 'Disponível', value: formatTonnes(data.summary.availableWeightKg), unit: 't', detail: 'recebimentos aceitos', tone: 'primary' },
        { label: 'Comprometido', value: formatTonnes(data.summary.committedWeightKg), unit: 't', detail: 'reservado para contratos de venda', tone: 'attention' },
        { label: 'Em revisão', value: formatTonnes(data.summary.blockedWeightKg), unit: 't', detail: 'sem disponibilidade', tone: 'attention' },
      ]} />
      <div className="demo-filterbar">
        <span>Localizações <strong>{locationCount}</strong></span>
        <span>Commodities <strong>{commodityCount}</strong></span>
        <span>Lotes <strong>{data.summary.lotCount}</strong></span>
        <span>Movimentos <strong>{data.movements.length}</strong></span>
        <span>Vendas <strong>{data.salesContracts.length}</strong></span>
      </div>

      <div className="demo-domain-layout">
        <div className="demo-main-stack">
          <DemoSection kicker="EXECUÇÃO DE VENDA" title="Alocação e expedição" id="execucao-venda" aside="contratos nascem no Comercial">
            <p>Cadastre e negocie o contrato de venda no <Link href="/comercial/vendas">Comercial</Link>. Aqui o estoque é reservado e expedido.</p>
            <FulfillmentForms data={{
              salesContracts: data.salesContracts,
              allocations: data.allocations,
              lots: data.lots,
              dispatches: data.dispatches,
              counterparties: data.counterparties,
              deliveryRequirementPolicies: data.deliveryRequirementPolicies,
              deliveryRequirements: data.deliveryRequirements,
            }} />
          </DemoSection>

          <DemoSection kicker="REQUISITOS POR SACADO" title="Pendências de ticket e portal" aside={`${data.deliveryRequirements.length} ocorrências`}>
            {data.deliveryRequirements.length > 0
              ? <DemoTable label="Pendências por expedição" columns={['Contrato', 'Sacado / terminal', 'Exigência', 'Responsável', 'Prazo', 'Evidência', 'Situação', 'Consequência']} rows={data.deliveryRequirements.map((item) => [
                item.contract_reference,
                `${item.counterparty_name} · ${item.terminal_code}`,
                `${item.title} · política v${item.policy_version}`,
                item.responsible_name,
                formatInventoryDate(item.due_at),
                item.portal_confirmation ?? item.evidence_reference ?? 'Pendente',
                <DemoStatus tone={item.status === 'ACCEPTED' || item.status === 'WAIVED' ? 'positive' : 'attention'} key={item.id}>{deliveryRequirementStatusLabel(item.status)}</DemoStatus>,
                deliveryRequirementConsequenceLabel(item.consequence),
              ])} />
              : <EmptyState compact eyebrow="SEM PENDÊNCIAS" title="Nenhuma exigência materializada" description="Cadastre uma regra por sacado e terminal; ela será copiada de forma auditável para as próximas expedições correspondentes." />}
          </DemoSection>

          <DemoSection kicker="CONCILIAÇÃO ECONÔMICA" title="Da carga ao recebimento" aside="sem ajuste financeiro automático">
            {data.economicReconciliations.length > 0
              ? <DemoTable label="Conciliação econômica por expedição" columns={['Cadeia', 'Expedido / destino', 'Receita', 'Custo alocado', 'Margem operacional', 'NF-e', 'Recebível', 'Recebido', 'Saldo']} rows={data.economicReconciliations.map((item) => [
                <span key={item.dispatch_id}>Compra v{item.purchase_contract_version_number} · carga <Link href={`/cargas/${item.source_load_id}`}>{item.source_load_id.slice(0, 8).toUpperCase()}</Link><br />Venda {item.sales_contract_reference} v{item.sales_contract_version_number}</span>,
                `${formatTonnes(item.dispatched_weight_kg)} t / ${item.destination_weight_kg ? `${formatTonnes(item.destination_weight_kg)} t` : 'pendente'}`,
                item.revenue_amount ? formatMoney(item.revenue_amount) : 'Pendente',
                item.allocated_acquisition_cost_amount
                  ? `${formatMoney(item.allocated_acquisition_cost_amount)}${item.allocated_component_impact_amount && Number(item.allocated_component_impact_amount) !== 0 ? ` (${formatMoney(item.allocated_component_impact_amount)} ajustes)` : ''}`
                  : 'Compra sem título valorizado',
                item.operational_margin_amount ? formatMoney(item.operational_margin_amount) : 'Pendente',
                item.fiscal_document_number
                  ? `${item.fiscal_document_number} · ${fiscalDocumentStatusLabel(item.fiscal_document_status)}`
                  : 'Não vinculada',
                item.title_number ? `${item.title_number} · ${titleStatusLabel(item.title_status)}` : 'Não emitido',
                formatMoney(item.settled_amount),
                item.outstanding_amount ? formatMoney(item.outstanding_amount) : '—',
              ])} />
              : <EmptyState compact eyebrow="SEM EXPEDIÇÕES" title="Nenhuma cadeia econômica para conciliar" description="A visão é formada automaticamente quando uma expedição gera seu evento financeiro." />}
            <p>Receita, custo e margem são derivados dos eventos existentes. Peso de destino, ticket e documentos aparecem lado a lado, mas não alteram nota, título ou baixa sem uma regra homologada.</p>
          </DemoSection>

          <DemoSection kicker="CONCILIAÇÃO NO DESTINO" title="Peso expedido versus peso aceito" aside="sem efeito financeiro automático">
            {data.dispatches.length > 0
              ? <DemoTable label="Conciliação de expedições" columns={['Contrato', 'Lote', 'Expedido', 'Destino', 'Diferença', 'Ticket', 'Situação']} rows={data.dispatches.map((dispatch) => [
                dispatch.contract_reference,
                dispatch.lot_code,
                `${formatTonnes(dispatch.quantity_kg)} t`,
                dispatch.destination_weight_kg ? `${formatTonnes(dispatch.destination_weight_kg)} t` : 'Pendente',
                dispatch.destination_difference_kg
                  ? `${Number(dispatch.destination_difference_kg) > 0 ? '+' : ''}${formatTonnes(dispatch.destination_difference_kg)} t`
                  : '—',
                dispatch.ticket_reference ?? '—',
                <DemoStatus tone={dispatch.destination_receipt_id ? 'attention' : undefined} key={dispatch.id}>
                  {dispatch.destination_receipt_id ? 'Aguardando política' : 'Peso pendente'}
                </DemoStatus>,
              ])} />
              : <EmptyState compact eyebrow="SEM EXPEDIÇÕES" title="Nenhuma saída para conciliar" description="Registre uma expedição para depois informar o peso e o ticket aceitos no destino." />}
          </DemoSection>

          <DemoSection kicker="CARTEIRA DE VENDA" title="Saldos executados" aside={`${data.salesContracts.length} contratos`}>
            {data.salesContracts.length > 0
              ? <DemoTable label="Contratos de venda" columns={['Contrato', 'Versão', 'Cliente', 'Contratado', 'Alocado', 'Expedido', 'Saldo']} rows={data.salesContracts.map((contract) => [
                contract.reference,
                `v${contract.version_number}`,
                contract.counterparty_name,
                `${formatTonnes(contract.quantity_kg)} t`,
                `${formatTonnes(contract.allocated_kg)} t`,
                `${formatTonnes(contract.dispatched_kg)} t`,
                `${formatTonnes(String(Number(contract.quantity_kg) - Number(contract.dispatched_kg)))} t`,
              ])} />
              : <EmptyState compact eyebrow="SEM VENDAS" title="Nenhum contrato de venda cadastrado" description="Cadastre a venda no Comercial para reservar lotes e registrar expedições." action={{ href: '/comercial/vendas', label: 'Cadastrar venda' }} />}
          </DemoSection>
          <DemoSection kicker="GOVERNANÇA FÍSICA" title="Titularidade, custódia, remaneio e perdas" id="governanca-estoque" aside="eventos auditáveis">
            <InventoryGovernanceForms data={data} />
          </DemoSection>
          <DemoSection kicker="POSIÇÃO CONSOLIDADA" title="Saldo por lote e localização" id="posicao-estoque" aside={`${data.lots.length} lotes visíveis`}>
            {positionRows.length > 0
              ? <DemoTable label="Posição de estoque" columns={['Localização', 'Lote', 'Contrato', 'Produto', 'Titularidade', 'Físico', 'Custódia', 'Disponível', 'Situação']} rows={positionRows} />
              : <EmptyState compact eyebrow="SEM SALDO" title="Nenhum recebimento aceito gerou estoque" description="Programe e receba uma carga para que o lote seja criado pelo livro de movimentos." action={{ href: '/cargas', label: 'Abrir agenda de cargas' }} />}
          </DemoSection>

          <DemoSection kicker="RASTREABILIDADE FÍSICA" title="Composição dos lotes" id="lotes" aside="origem, qualidade e vínculo">
            <div className="lot-ledger">
              {data.lots.length ? data.lots.map((lot) => <LotCard lot={lot} key={lot.id} />) : <EmptyState compact eyebrow="SEM LOTES" title="Nenhum lote disponível" description="Os lotes são criados automaticamente depois do aceite do recebimento." action={{ href: '/recebimentos', label: 'Abrir recebimentos' }} />}
            </div>
          </DemoSection>

          <DemoSection kicker="LIVRO DE MOVIMENTOS" title="Entradas, correções e saídas" id="movimentos" aside="ordem cronológica">
            {movementRows.length > 0
              ? <DemoTable label="Movimentos de estoque" columns={['Data', 'Movimento', 'Carga', 'Lote', 'Quantidade', 'Origem']} rows={movementRows} rowHrefs={data.movements.map((movement) => movement.sourceLoadId ? `/cargas/${movement.sourceLoadId}` : undefined)} />
              : <EmptyState compact eyebrow="LIVRO VAZIO" title="Nenhum movimento registrado" description="Entradas, correções, remaneios e expedições aparecerão aqui sem edição direta do saldo." action={{ href: '/recebimentos', label: 'Abrir recebimentos' }} />}
          </DemoSection>

          <DemoSection kicker="CONTROLE" title="Integridade do saldo" id="reconciliacao" aside="calculado, nunca editado diretamente">
            <div className="inventory-reconciliation">
              <div><span>Entradas e correções</span><strong>{data.movements.length}</strong><small>movimentos imutáveis</small></div>
              <b aria-hidden="true">=</b>
              <div><span>Livro de estoque</span><strong>{formatTonnes(data.summary.physicalWeightKg)} t</strong><small>soma dos movimentos</small></div>
              <b aria-hidden="true">→</b>
              <div data-tone={data.summary.pendingOwnershipCount > 0 ? 'attention' : undefined}><span>Disponível</span><strong>{formatTonnes(data.summary.availableWeightKg)} t</strong><small>somente recebimentos aceitos</small></div>
            </div>
          </DemoSection>
        </div>

        <aside className="demo-side-stack">
          <section><p className="section-kicker">GOVERNANÇA</p><h2>Título e risco separados</h2><p>A entrada física não transfere automaticamente propriedade ou risco. Esses estados permanecem pendentes até a regra contratual ser definida.</p></section>
          <section><p className="section-kicker">ATENÇÃO</p><div className="demo-alert" data-tone="attention"><strong>{data.summary.pendingOwnershipCount} lote(s) sem titularidade definida</strong><p>O saldo físico está disponível operacionalmente, mas a classificação jurídica ainda exige decisão de produto.</p></div></section>
          <section><p className="section-kicker">OPERAÇÃO CONECTADA</p><h2>Recebimentos alimentam o saldo</h2><p>Corrigir ou reabrir uma pesagem gera automaticamente um movimento compensatório.</p><Link className="operational-link" href="/cargas">Abrir agenda <span>→</span></Link></section>
        </aside>
      </div>
    </>
  );
}

function LotCard({ lot }: { lot: InventoryLot }) {
  return (
    <article>
      <header><div><span>{lot.lotCode}</span><strong>{commodityLabel(lot.commodity)} · {ownershipLabel(lot.ownershipStatus)}</strong></div><DemoStatus tone={lot.status === 'AVAILABLE' ? 'positive' : 'attention'}>{lot.status === 'AVAILABLE' ? 'Liberado' : 'Em revisão'}</DemoStatus></header>
      <dl>
        <div><dt>Origem</dt><dd>Carga {lot.sourceLoadId.slice(0, 8).toUpperCase()} · contrato v{lot.contractVersionNumber} · placa {lot.vehiclePlate}</dd></div>
        <div><dt>Qualidade</dt><dd>Umidade {formatPercent(lot.quality.moisturePct)} · impureza {formatPercent(lot.quality.impurityPct)}</dd></div>
        <div><dt>Localização</dt><dd>{lot.location.name}</dd></div>
        <div><dt>Saldo físico</dt><dd>{formatTonnes(lot.quantityKg)} t</dd></div>
      </dl>
    </article>
  );
}

function commodityLabel(value: string): string {
  return value === 'MILHO' ? 'Milho' : value === 'SOJA' ? 'Soja' : value;
}

function ownershipLabel(value: string): string {
  if (value === 'OWN') return 'Próprio';
  if (value === 'THIRD_PARTY') return 'Terceiros';
  return 'A definir';
}

function custodyLabel(value: string): string {
  if (value === 'IN_STORAGE') return 'Armazenado';
  if (value === 'IN_TRANSIT') return 'Em trânsito';
  if (value === 'RELEASED') return 'Liberado';
  return value;
}

function formatPercent(value: string): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value))}%`;
}

function deliveryRequirementStatusLabel(value: string): string {
  if (value === 'PENDING') return 'Pendente';
  if (value === 'SUBMITTED') return 'Enviado';
  if (value === 'ACCEPTED') return 'Aceito';
  if (value === 'REJECTED') return 'Rejeitado';
  if (value === 'WAIVED') return 'Dispensado';
  return value;
}

function deliveryRequirementConsequenceLabel(value: string): string {
  if (value === 'BLOCK_OPERATIONAL_CLOSURE') return 'Bloquear fechamento (não aplicado)';
  if (value === 'BLOCK_ANTICIPATION') return 'Bloquear antecipação (não aplicado)';
  return 'Informativa';
}

function formatMoney(value: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

function fiscalDocumentStatusLabel(value: string | null): string {
  if (value === 'VALIDATED') return 'validada';
  if (value === 'REJECTED') return 'rejeitada';
  return 'recebida';
}

function titleStatusLabel(value: string | null): string {
  if (value === 'PARTIALLY_SETTLED') return 'parcial';
  if (value === 'SETTLED') return 'liquidado';
  return 'aberto';
}
