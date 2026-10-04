'use client';

import { Button, DecimalField } from '@mountier/tier-trade-design-system';
import type { CSSProperties } from 'react';
import { useActionState } from 'react';
import type { RiskPosition, RiskWorkspace } from '../../lib/risk';
import { formatRiskMoney, formatWeight } from '../../lib/risk';
import { DemoMetricStrip, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { configureRiskPolicyAction } from './actions';

const initialState = { ok: false, message: '' };

export function RiskWorkspaceView({ data }: { data: RiskWorkspace }) {
  const [state, action, pending] = useActionState(configureRiskPolicyAction, initialState);
  const primary = data.positions[0];
  if (!primary) return <p>Nenhuma posição contratual ou física foi encontrada para este tenant.</p>;

  const exposureRows = data.positions.map((position) => [
    commodityLabel(position.commodity), formatWeight(position.physical.purchaseContractedKg),
    formatWeight(position.physical.salesContractedKg), formatSignedWeight(position.physical.netContractualKg),
    formatWeight(position.physical.physicalStockKg),
    <DemoStatus tone={statusTone(position.limit.status)} key={position.commodity}>
      {statusLabel(position.limit.status)}
    </DemoStatus>,
  ]);
  const financialRows = data.positions.map((position) => [
    commodityLabel(position.commodity), formatRiskMoney(position.financial.purchaseCommitmentAmount),
    formatRiskMoney(position.financial.salesCommitmentAmount), formatRiskMoney(position.financial.netContractedAmount),
    formatRiskMoney(position.financial.projectedReceivableAmount),
    formatRiskMoney(position.financial.outstandingReceivableAmount),
  ]);
  const usage = Math.min(Number(primary.limit.usagePct ?? 0), 100);

  return (
    <>
      <DemoMetricStrip items={[
        { label: 'Posição contratual líquida', value: formatSignedWeight(primary.physical.netContractualKg), detail: commodityLabel(primary.commodity), tone: primary.limit.status === 'EXCEEDED' || primary.limit.status === 'WARNING' ? 'attention' : 'primary' },
        { label: 'Estoque físico', value: formatWeight(primary.physical.physicalStockKg), detail: `${formatWeight(primary.physical.availableStockKg)} disponível` },
        { label: 'Cobertura da venda', value: formatPercent(primary.physical.fulfillmentCoveragePct), detail: 'alocado + expedido', tone: 'primary' },
        { label: 'Recebíveis em aberto', value: formatRiskMoney(primary.financial.outstandingReceivableAmount), detail: 'títulos persistidos' },
      ]} />

      <div className="demo-domain-layout risk-live-layout">
        <div className="demo-main-stack">
          <DemoSection kicker="POSIÇÃO FÍSICA" title="Exposição contratual e estoque" id="exposicao" aside="dados consolidados do backend">
            <DemoTable label="Posição física por commodity" columns={['Mercado', 'Compras', 'Vendas', 'Líquido', 'Estoque', 'Limite']} rows={exposureRows} />
          </DemoSection>
          <DemoSection kicker="POSIÇÃO FINANCEIRA" title="Compromissos brutos e recebíveis" aside="sem tributos não homologados">
            <DemoTable label="Posição financeira por commodity" columns={['Mercado', 'Compras', 'Vendas', 'Saldo bruto', 'A receber projetado', 'Em aberto']} rows={financialRows} />
          </DemoSection>
          <DemoSection kicker="COBERTURA FÍSICA" title="Execução da venda" id="cobertura" aside="estoque, alocação e expedição">
            <dl className="summary-ledger">
              <div><dt>Estoque comprometido</dt><dd>{formatWeight(primary.physical.committedStockKg)}</dd></div>
              <div><dt>Estoque disponível</dt><dd>{formatWeight(primary.physical.availableStockKg)}</dd></div>
              <div><dt>Volume expedido</dt><dd>{formatWeight(primary.physical.dispatchedKg)}</dd></div>
              <div><dt>Recebido no caixa</dt><dd>{formatRiskMoney(primary.financial.receivedAmount)}</dd></div>
            </dl>
          </DemoSection>
          <DemoSection kicker="RISCO DE MERCADO" title="Métricas aguardando configuração" aside="sem valores fictícios">
            <div className="demo-alert" data-tone="attention">
              <strong>MTM, P&amp;L, preço, base, câmbio e VaR ainda não calculados</strong>
              {data.marketRisk.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}
            </div>
          </DemoSection>
        </div>

        <aside className="demo-side-stack">
          <section id="limites">
            <p className="section-kicker">LIMITE DE RISCO</p>
            <h2>{primary.limit.version ? `Política v${primary.limit.version}` : 'Não configurada'}</h2>
            <dl className="limit-ledger">
              <div>
                <dt>Posição líquida</dt><dd>{formatSignedWeight(primary.physical.netContractualKg)}</dd>
                <span><i style={{ '--bar': `${usage}%` } as CSSProperties} /></span>
                <small>{primary.limit.maxNetOpenKg ? `limite ${formatWeight(primary.limit.maxNetOpenKg)}` : 'defina um limite'}</small>
              </div>
              <div><dt>Utilização</dt><dd>{primary.limit.usagePct ? formatPercent(primary.limit.usagePct) : '—'}</dd></div>
              <div><dt>Faixa de alerta</dt><dd>{primary.limit.warningThresholdPct ? formatPercent(primary.limit.warningThresholdPct) : '—'}</dd></div>
            </dl>
          </section>
          <section>
            <p className="section-kicker">CONFIGURAÇÃO</p><h2>Versionar política</h2>
            <form action={action} className="risk-policy-form">
              <input type="hidden" name="commodity" value={primary.commodity} />
              <DecimalField name="maxNetOpenKg" label="Limite líquido" suffix="kg" defaultValue={primary.limit.maxNetOpenKg ?? '0'} fractionDigits={3} emptyWhenZero required />
              <DecimalField name="warningThresholdPct" label="Alertar a partir de" suffix="%" defaultValue={primary.limit.warningThresholdPct ?? '80'} fractionDigits={2} emptyWhenZero required />
              {state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null}
              <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar nova versão'}</Button>
            </form>
          </section>
          <section><p className="section-kicker">ATUALIZAÇÃO</p><h2>Posição operacional</h2><p>Calculada em {formatDateTime(data.calculatedAt)} a partir de contratos, estoque, alocações, expedições e financeiro.</p></section>
        </aside>
      </div>
    </>
  );
}

function commodityLabel(value: string): string { return value === 'MILHO' ? 'Milho' : value === 'SOJA' ? 'Soja' : value; }
function formatPercent(value: string): string { return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}%`; }
function formatSignedWeight(value: string): string { return `${Number(value) >= 0 ? '+' : '−'} ${formatWeight(String(Math.abs(Number(value))))}`; }
function formatDateTime(value: string): string { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value)); }
function statusLabel(value: RiskPosition['limit']['status']): string {
  if (value === 'WITHIN_LIMIT') return 'Dentro do limite';
  if (value === 'WARNING') return 'Faixa de alerta';
  if (value === 'EXCEEDED') return 'Limite excedido';
  return 'Não configurado';
}
function statusTone(value: RiskPosition['limit']['status']): 'positive' | 'attention' | undefined {
  if (value === 'WITHIN_LIMIT') return 'positive';
  if (value === 'WARNING' || value === 'EXCEEDED') return 'attention';
  return undefined;
}
