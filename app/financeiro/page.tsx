import Link from 'next/link';
import type { CSSProperties } from 'react';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { currentUserContext } from '../../lib/current-user';

const settlementRows = [
  [<Link href="/financeiro/liquidacoes/LQ-2026-01877" key="l1">LQ-2026-01877</Link>, 'Agropecuária Boa Vista', 'CT-2026-00512', '13/10/2026', 'R$ 44.910,00', <DemoStatus tone="attention" key="s1">Aprovação</DemoStatus>],
  ['LQ-2026-01876', 'Fazenda Primavera', 'CT-2026-00498', '10/10/2026', 'R$ 132.840,00', <DemoStatus tone="info" key="s2">Programada</DemoStatus>],
  ['LQ-2026-01875', 'Cooperativa Campo Alto', 'CT-2026-00471', '08/10/2026', 'R$ 286.410,00', <DemoStatus tone="positive" key="s3">Conciliada</DemoStatus>],
];

const payableRows = [
  ['TP-2026-04412', 'Agropecuária Boa Vista', '13/10', 'Mercadoria', 'R$ 44.910,00', <DemoStatus tone="attention" key="p1">A aprovar</DemoStatus>],
  ['TP-2026-04401', 'Fazenda Primavera', '10/10', 'Mercadoria', 'R$ 132.840,00', <DemoStatus tone="info" key="p2">Programado</DemoStatus>],
  ['OT-2026-00931', 'Tesouro / obrigação fiscal', '20/11', 'Tributo', 'R$ 90,00', <DemoStatus key="p3">Provisionado</DemoStatus>],
];

const receivableRows = [
  ['TR-2026-02108', 'Nutriaves Alimentos', '15/10', 'Venda de milho', 'R$ 1.497.600,00', <DemoStatus tone="positive" key="r1">Confirmado</DemoStatus>],
  ['TR-2026-02096', 'Rações Cerrado', '09/10', 'Venda de soja', 'R$ 486.200,00', <DemoStatus tone="info" key="r2">A vencer</DemoStatus>],
];

const cashFlow: Array<[string, number, number, string]> = [
  ['02/10', 94, 42, '+ R$ 52 mil'],
  ['05/10', 128, 64, '+ R$ 64 mil'],
  ['08/10', 82, 146, '− R$ 64 mil'],
  ['12/10', 184, 58, '+ R$ 126 mil'],
  ['15/10', 220, 72, '+ R$ 148 mil'],
  ['20/10', 104, 156, '− R$ 52 mil'],
];

export default async function FinancialPage() {
  const { userLabel } = await currentUserContext();

  return (
    <AppShell activeDomain="financial" userLabel={userLabel}>
      <DemoPageHeader domain="Financeiro" section="Visão geral" eyebrow="Liquidação e caixa" title="Controle financeiro" description="Obrigações, recebíveis, conciliação e projeção de caixa ligados à operação física." scope="Posição em 01/10/2026 · 10:30" />
      <div className="demo-page demo-workspace">
        <DemoNotice />
        <DemoMetricStrip items={[
          { label: 'A pagar · 7 dias', value: 'R$ 464 mil', detail: '8 títulos e obrigações' },
          { label: 'A receber · 7 dias', value: 'R$ 1,98 mi', detail: '5 títulos', tone: 'primary' },
          { label: 'Saldo projetado', value: 'R$ 3,24 mi', detail: 'posição em 15/10' },
          { label: 'Pendências', value: '2', detail: '1 aprovação · 1 conciliação', tone: 'attention' },
        ]} />

        <div className="demo-domain-layout">
          <div className="demo-main-stack">
            <DemoSection kicker="OPERAÇÕES EM FECHAMENTO" title="Liquidações recentes" id="liquidacoes" aside="compra, carga e documento">
              <DemoTable label="Liquidações demonstrativas" columns={['Liquidação', 'Contraparte', 'Contrato', 'Vencimento', 'Valor líquido', 'Status']} rows={settlementRows} />
            </DemoSection>

            <div className="finance-ledgers">
              <DemoSection kicker="OBRIGAÇÕES" title="Contas a pagar" id="pagar"><DemoTable label="Contas a pagar demonstrativas" columns={['Título', 'Favorecido', 'Vencimento', 'Natureza', 'Valor', 'Status']} rows={payableRows} /></DemoSection>
              <DemoSection kicker="DIREITOS" title="Contas a receber" id="receber"><DemoTable label="Contas a receber demonstrativas" columns={['Título', 'Cliente', 'Vencimento', 'Natureza', 'Valor', 'Status']} rows={receivableRows} /></DemoSection>
            </div>

            <DemoSection kicker="TESOURARIA" title="Fluxo de caixa projetado" id="fluxo-caixa" aside="entradas × saídas · R$ mil">
              <div className="cash-flow-chart" aria-label="Fluxo de caixa projetado"><div className="cash-flow-legend"><span><i data-tone="positive" /> Entradas</span><span><i data-tone="attention" /> Saídas</span></div><div className="cash-flow-bars">{cashFlow.map(([day, incoming, outgoing, balance]) => <div key={day}><div><i data-tone="positive" style={{ '--bar': `${incoming}px` } as CSSProperties} /><i data-tone="attention" style={{ '--bar': `${outgoing}px` } as CSSProperties} /></div><span>{day}</span><strong>{balance}</strong></div>)}</div></div>
            </DemoSection>
          </div>

          <aside className="demo-side-stack">
            <section id="conciliacao"><p className="section-kicker">CONCILIAÇÃO</p><h2>98,6% conciliado</h2><dl className="summary-ledger"><div><dt>Documentos</dt><dd>142 / 144</dd></div><div><dt>Banco</dt><dd>R$ 2,84 mi</dd></div><div><dt>Diferença</dt><dd>R$ 1.248,20</dd></div><div><dt>Último retorno</dt><dd>10:12</dd></div></dl><div className="demo-alert" data-tone="attention"><strong>Duas partidas pendentes</strong><p>Uma tarifa bancária e um crédito sem identificação aguardam classificação.</p></div></section>
            <section><p className="section-kicker">PRÓXIMA DECISÃO</p><h2>LQ-2026-01877</h2><p>Pagamento de R$ 44.910,00 à Agropecuária Boa Vista aguarda aprovação segregada.</p><Link className="operational-link" href="/financeiro/liquidacoes/LQ-2026-01877">Abrir liquidação <span>→</span></Link></section>
            <section><p className="section-kicker">DISPONIBILIDADE</p><dl className="summary-ledger"><div><dt>Saldo bancário</dt><dd>R$ 1,72 mi</dd></div><div><dt>Aplicações D+0</dt><dd>R$ 980 mil</dd></div><div><dt>Limite rotativo</dt><dd>R$ 2,00 mi</dd></div><div><dt>Disponível total</dt><dd>R$ 4,70 mi</dd></div></dl></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
