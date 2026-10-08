import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUserContext } from '../../../../lib/current-user';
import { formatFinancialDate, formatMoney, loadFinance, titleStatusLabel } from '../../../../lib/finance';
import { AppShell } from '../../../app-shell';
import { DetailNavigation } from '../../../detail-navigation';
import { DemoNotice } from '../../../demo-notice';
import { PageFeedback } from '../../../page-state';

export default async function SettlementDetailPage({
  params,
}: { params: Promise<{ settlementId: string }> }) {
  const [{ settlementId }, { userLabel, identityHeaders }] = await Promise.all([
    params, currentUserContext(),
  ]);
  const result = await loadFinance(identityHeaders);

  if (result.error || !result.data) {
    return (
      <AppShell activeDomain="financial" userLabel={userLabel}>
        <PageFeedback title="Não foi possível abrir a liquidação" message={result.error} action={{ href: '/financeiro', label: 'Voltar ao financeiro' }} />
      </AppShell>
    );
  }
  const event = result.data.events.find((item) => item.id === settlementId);
  if (!event || event.direction !== 'INFLOW') notFound();
  const contractReference = event.contractReference ?? 'Sem contrato';
  const dispatchReference = event.dispatchDocumentReference ?? 'Sem expedição';
  const title = event.title;
  const settlements = result.data.settlements.filter((item) => item.titleId === title?.id);
  const activeSettlements = settlements.filter((item) => !item.reversedAt);
  const received = activeSettlements.reduce((total, item) => total + Number(item.amount), 0);
  const status = title ? titleStatusLabel(title.status) : event.calculationStatus === 'READY'
    ? 'Aguardando título' : 'Política de arredondamento pendente';

  return (
    <AppShell activeDomain="financial" userLabel={userLabel}>
      <header className="entity-header settlement-header">
        <DetailNavigation backHref="/financeiro" backLabel="Voltar ao financeiro" items={[{ label: 'Financeiro', href: '/financeiro' }, { label: 'Previsões', href: '/financeiro' }, { label: dispatchReference }]} />
        <div className="entity-title-row">
          <div>
            <p className="entity-kind">Recebível de venda</p>
            <h1>{contractReference} · {event.beneficiaryName}</h1>
            <p className="entity-id">{event.id} · fonte oficial do tenant</p>
          </div>
          <span className="demo-status" data-tone={title?.status === 'SETTLED' ? 'positive' : 'attention'}>{status}</span>
        </div>
        <dl className="entity-facts">
          <div><dt>Contrato</dt><dd>{contractReference}</dd></div>
          <div><dt>Expedição</dt><dd>{dispatchReference}</dd></div>
          <div><dt>Quantidade</dt><dd>{Number(event.quantityKg ?? 0).toLocaleString('pt-BR')} kg</dd></div>
          <div><dt>Título</dt><dd>{title?.number ?? 'não emitido'}</dd></div>
          <div><dt>Vencimento</dt><dd>{title ? formatFinancialDate(title.dueDate) : event.expectedOn ? formatFinancialDate(event.expectedOn) : 'a definir'}</dd></div>
        </dl>
        <ol className="trace-rail settlement-trace" aria-label="Rastreabilidade do recebível">
          <li data-state="done"><span /><div><strong>Expedição</strong><small>{dispatchReference}</small></div></li>
          <li data-state="done"><span /><div><strong>Previsão</strong><small>{event.calculatedAmount ? formatMoney(event.calculatedAmount) : 'regra pendente'}</small></div></li>
          <li data-state={title ? 'done' : 'current'}><span /><div><strong>Título</strong><small>{title?.number ?? 'pendente'}</small></div></li>
          <li data-state={received > 0 ? 'done' : undefined}><span /><div><strong>Recebimento</strong><small>{formatMoney(received)}</small></div></li>
          <li data-state={title?.status === 'SETTLED' ? 'done' : 'current'}><span /><div><strong>Saldo</strong><small>{title ? formatMoney(title.outstandingAmount) : '—'}</small></div></li>
        </ol>
      </header>

      <div className="demo-page settlement-page">
        {result.data.tenant.isDemo ? <DemoNotice persisted /> : null}
        {event.calculationStatus !== 'READY'
          ? <div className="demo-alert" data-tone="attention"><strong>Emissão bloqueada com segurança</strong><p>O cálculo produziu fração de centavo. A política de arredondamento do tenant precisa ser homologada antes do título.</p></div>
          : null}
        <div className="settlement-layout">
          <div className="settlement-main">
            <section className="detail-section">
              <header><div><p className="section-kicker">CÁLCULO DETERMINÍSTICO</p><h2>Memória de cálculo</h2></div><span className="data-source">{event.formulaCode} · v{event.formulaVersion}</span></header>
              <div className="calculation-demo">
                <div><span /><div><strong>Quantidade expedida</strong><small>Expedição {dispatchReference}</small></div><b>{Number(event.quantityKg ?? 0).toLocaleString('pt-BR')} kg</b></div>
                <div><span>×</span><div><strong>Preço contratado por kg</strong><small>Contrato {contractReference}</small></div><b>{formatMoney(event.unitPrice ?? '0')}</b></div>
                <div data-total="true"><span>=</span><div><strong>Valor bruto previsto</strong><small>Antes dos ajustes fiscais confirmados</small></div><b>{event.calculatedAmount ? formatMoney(event.calculatedAmount) : event.rawAmount ?? '—'}</b></div>
              </div>
              <p className="detail-note">A memória preserva entradas, fórmula, versão e a decisão de arredondamento.</p>
            </section>

            <section className="detail-section">
              <header><div><p className="section-kicker">DESDOBRAMENTO FINANCEIRO</p><h2>Título e saldo</h2></div></header>
              {title
                ? <div className="financial-groups"><article><h3>Título a receber · {title.number}</h3><dl><div><dt>Cliente</dt><dd>{event.beneficiaryName}</dd></div><div><dt>Documento</dt><dd>{title.documentReference}</dd></div><div><dt>Valor original</dt><dd>{formatMoney(title.amount)}</dd></div><div><dt>Ajustes fiscais</dt><dd>{formatMoney(title.adjustedAmount)}</dd></div><div><dt>Recebido</dt><dd>{formatMoney(title.settledAmount)}</dd></div><div><dt>Saldo</dt><dd>{formatMoney(title.outstandingAmount)}</dd></div><div><dt>Status</dt><dd>{titleStatusLabel(title.status)}</dd></div></dl></article></div>
                : <p>O título ainda não foi emitido. A operação pode ser concluída na visão geral do Financeiro.</p>}
            </section>

            <section className="detail-section">
              <header><div><p className="section-kicker">HISTÓRICO DE CAIXA</p><h2>Recebimentos e estornos</h2></div></header>
              {settlements.length
                ? <div className="financial-groups">{settlements.map((item) => <article key={item.id}><h3>{item.bankReference}</h3><dl><div><dt>Valor</dt><dd>{formatMoney(item.amount)}</dd></div><div><dt>Data</dt><dd>{formatFinancialDate(item.receivedAt)}</dd></div><div><dt>Status</dt><dd>{item.reversedAt ? 'Estornado' : 'Confirmado'}</dd></div>{item.reversalReason ? <div><dt>Motivo</dt><dd>{item.reversalReason}</dd></div> : null}</dl></article>)}</div>
                : <p>Nenhum recebimento registrado para este título.</p>}
            </section>
          </div>

          <aside className="settlement-sidebar">
            <section><p className="section-kicker">OBJETOS VINCULADOS</p><nav className="linked-objects" aria-label="Objetos vinculados"><Link href="/estoque">Contrato de venda <strong>{contractReference}</strong></Link><Link href="/estoque">Expedição <strong>{dispatchReference}</strong></Link>{title ? <span>Título <strong>{title.number}</strong></span> : null}</nav></section>
            <section><p className="section-kicker">CONTROLE</p><h2>Ajustes explícitos</h2><p>Retenções só alteram o saldo quando uma obrigação fiscal aceita registra esse efeito sobre o título.</p></section>
            <section><Link className="operational-link" href="/financeiro">Voltar ao financeiro <span>→</span></Link></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
