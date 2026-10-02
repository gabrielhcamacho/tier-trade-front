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

export default async function InventoryPage() {
  const user = await currentUserContext();
  const result = await loadInventory(user.identityHeaders);

  return (
    <AppShell activeDomain="inventory" userLabel={user.userLabel}>
      <DemoPageHeader
        domain="Estoque"
        section="Posição"
        eyebrow="Custódia e disponibilidade"
        title="Posição de estoque"
        description="Saldo físico rastreado por recebimento, lote e localização."
        scope="Fonte: livro imutável de movimentos"
      />
      <div className="demo-page demo-workspace">
        {result.data
          ? <InventoryWorkspace data={result.data} />
          : <InventoryError message={result.error} />}
      </div>
    </AppShell>
  );
}

function InventoryError({ message }: { message: string }) {
  return (
    <section className="detail-section demo-section">
      <p className="section-kicker">ESTOQUE INDISPONÍVEL</p>
      <h2>Não foi possível carregar a posição</h2>
      <p>{message}</p>
    </section>
  );
}

function InventoryWorkspace({ data }: { data: InventoryPosition }) {
  const locationCount = new Set(data.lots.map((lot) => lot.location.code)).size;
  const commodityCount = new Set(data.lots.map((lot) => lot.commodity)).size;
  const positionRows = data.lots.map((lot) => [
    `${lot.location.name} · ${lot.location.code}`,
    lot.lotCode,
    commodityLabel(lot.commodity),
    ownershipLabel(lot.ownershipStatus),
    `${formatTonnes(lot.quantityKg)} t`,
    custodyLabel(lot.custodyStatus),
    lot.status === 'AVAILABLE' ? `${formatTonnes(lot.quantityKg)} t` : '0,000 t',
    <DemoStatus tone={lot.status === 'AVAILABLE' ? 'positive' : 'attention'} key={lot.id}>
      {lot.status === 'AVAILABLE' ? 'Disponível' : 'Em revisão'}
    </DemoStatus>,
  ]);
  const movementRows = data.movements.map((movement) => [
    formatInventoryDate(movement.occurredAt),
    movementLabel(movement.type),
    <Link href={`/cargas/${movement.sourceLoadId}`} key={movement.id}>
      {movement.sourceLoadId.slice(0, 8).toUpperCase()}
    </Link>,
    movement.lotCode,
    `${Number(movement.quantityDeltaKg) >= 0 ? '+' : '−'} ${formatTonnes(String(Math.abs(Number(movement.quantityDeltaKg))))} t`,
    `Recebimento ${movement.sourceReceiptId.slice(0, 8).toUpperCase()}`,
  ]);

  return (
    <>
      {data.tenant.isDemo ? <DemoNotice persisted /> : null}
      <DemoMetricStrip items={[
        { label: 'Estoque físico', value: formatTonnes(data.summary.physicalWeightKg), unit: 't', detail: 'saldo do livro de movimentos' },
        { label: 'Disponível', value: formatTonnes(data.summary.availableWeightKg), unit: 't', detail: 'recebimentos aceitos', tone: 'primary' },
        { label: 'Em revisão', value: formatTonnes(data.summary.blockedWeightKg), unit: 't', detail: 'sem disponibilidade', tone: 'attention' },
        { label: 'Titularidade pendente', value: String(data.summary.pendingOwnershipCount), detail: 'lotes aguardando regra contratual', tone: 'attention' },
      ]} />
      <div className="demo-filterbar">
        <span>Localizações <strong>{locationCount}</strong></span>
        <span>Commodities <strong>{commodityCount}</strong></span>
        <span>Lotes <strong>{data.summary.lotCount}</strong></span>
        <span>Movimentos <strong>{data.movements.length}</strong></span>
      </div>

      <div className="demo-domain-layout">
        <div className="demo-main-stack">
          <DemoSection kicker="POSIÇÃO CONSOLIDADA" title="Saldo por lote e localização" aside={`${data.lots.length} lotes visíveis`}>
            {positionRows.length > 0
              ? <DemoTable label="Posição de estoque" columns={['Localização', 'Lote', 'Produto', 'Titularidade', 'Físico', 'Custódia', 'Disponível', 'Situação']} rows={positionRows} />
              : <p>Nenhum recebimento aceito gerou estoque para este tenant.</p>}
          </DemoSection>

          <DemoSection kicker="RASTREABILIDADE FÍSICA" title="Composição dos lotes" id="lotes" aside="origem, qualidade e vínculo">
            <div className="lot-ledger">
              {data.lots.map((lot) => <LotCard lot={lot} key={lot.id} />)}
            </div>
          </DemoSection>

          <DemoSection kicker="LIVRO DE MOVIMENTOS" title="Entradas e correções de recebimento" id="movimentos" aside="ordem cronológica">
            {movementRows.length > 0
              ? <DemoTable label="Movimentos de estoque" columns={['Data', 'Movimento', 'Carga', 'Lote', 'Quantidade', 'Origem']} rows={movementRows} />
              : <p>Nenhum movimento registrado.</p>}
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
        <div><dt>Origem</dt><dd>Carga {lot.sourceLoadId.slice(0, 8).toUpperCase()} · placa {lot.vehiclePlate}</dd></div>
        <div><dt>Qualidade</dt><dd>Umidade {formatPercent(lot.quality.moisturePct)} · impureza {formatPercent(lot.quality.impurityPct)}</dd></div>
        <div><dt>Localização</dt><dd>{lot.location.name}</dd></div>
        <div><dt>Saldo físico</dt><dd>{formatTonnes(lot.quantityKg)} t</dd></div>
      </dl>
    </article>
  );
}

function commodityLabel(value: string): string {
  return value === 'MILHO' ? 'Milho' : value;
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
