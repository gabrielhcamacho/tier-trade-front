import Link from 'next/link';
import type { CSSProperties } from 'react';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { currentUserContext } from '../../lib/current-user';

const positionRows = [
  ['ARM-RV01 · Silo 03', 'LT-RV-26-0312', 'Milho 25/26', 'Próprio', '1.248,60 t', '758,40 t', '490,20 t', <DemoStatus tone="positive" key="s1">Disponível</DemoStatus>],
  ['ARM-RV01 · Silo 04', 'LT-RV-26-0313', 'Milho 25/26', 'Terceiros', '884,20 t', '720,00 t', '164,20 t', <DemoStatus tone="info" key="s2">Depositado</DemoStatus>],
  ['ARM-RV01 · Moega 02', 'LT-RV-26-0314', 'Milho 25/26', 'Próprio', '96,00 t', '96,00 t', '0,00 t', <DemoStatus tone="attention" key="s3">Em trânsito</DemoStatus>],
  ['ARM-JT02 · Silo 01', 'LT-JT-26-0108', 'Soja 25/26', 'Próprio', '612,80 t', '410,00 t', '202,80 t', <DemoStatus key="s4">Disponível</DemoStatus>],
];

const movementRows = [
  ['01/10 · 10:18', 'Entrada', 'CG-26-10421', 'LT-RV-26-0312', '+ 48,000 t', 'RM-RV-26-08812'],
  ['01/10 · 09:42', 'Transferência', 'TR-26-00114', 'LT-RV-26-0313', '− 32,000 t', 'ARM-RV01 → ARM-JT02'],
  ['30/09 · 17:06', 'Reserva', 'CT-V-2026-00208', 'LT-RV-26-0312', '− 240,000 t', 'entrega 08–12/10'],
  ['30/09 · 14:20', 'Ajuste validado', 'AJ-26-00031', 'LT-JT-26-0108', '+ 0,120 t', 'diferença de balança'],
];

export default async function InventoryPage() {
  const { userLabel } = await currentUserContext();

  return (
    <AppShell activeDomain="inventory" userLabel={userLabel}>
      <DemoPageHeader domain="Estoque" section="Posição" eyebrow="Custódia e disponibilidade" title="Posição de estoque" description="Visão física, comercial e de titularidade por unidade e lote." scope="Atualizado em 01/10/2026 · 10:30" />
      <div className="demo-page demo-workspace">
        <DemoNotice />
        <DemoMetricStrip items={[
          { label: 'Estoque físico', value: '2.841,60', unit: 't', detail: 'todas as unidades' },
          { label: 'Disponível', value: '857,20', unit: 't', detail: 'após reservas', tone: 'primary' },
          { label: 'De terceiros', value: '884,20', unit: 't', detail: 'custódia segregada' },
          { label: 'Diferença em apuração', value: '0,12', unit: 't', detail: '0,004% do saldo', tone: 'attention' },
        ]} />
        <div className="demo-filterbar"><span>Unidade <strong>Todas</strong></span><span>Commodity <strong>Todas</strong></span><span>Safra <strong>25/26</strong></span><span>Titularidade <strong>Todas</strong></span></div>

        <div className="demo-domain-layout">
          <div className="demo-main-stack">
            <DemoSection kicker="POSIÇÃO CONSOLIDADA" title="Saldo por lote e localização" aside="4 lotes visíveis">
              <DemoTable label="Posição demonstrativa de estoque" columns={['Localização', 'Lote', 'Produto', 'Titularidade', 'Físico', 'Comprometido', 'Disponível', 'Situação']} rows={positionRows} />
            </DemoSection>

            <DemoSection kicker="RASTREABILIDADE FÍSICA" title="Composição dos lotes" id="lotes" aside="origem, qualidade e vínculo">
              <div className="lot-ledger">
                <article><header><div><span>LT-RV-26-0312</span><strong>Milho · próprio</strong></div><DemoStatus tone="positive">Liberado</DemoStatus></header><dl><div><dt>Origem</dt><dd>11 cargas · 3 contratos</dd></div><div><dt>Qualidade média</dt><dd>Umidade 14,1% · avariados 2,4%</dd></div><div><dt>Vínculo de venda</dt><dd>CT-V-2026-00208 · 758,40 t</dd></div><div><dt>Disponibilidade</dt><dd>490,20 t</dd></div></dl></article>
                <article><header><div><span>LT-RV-26-0313</span><strong>Milho · terceiros</strong></div><DemoStatus tone="info">Custódia</DemoStatus></header><dl><div><dt>Depositante</dt><dd>Cooperativa Campo Alto</dd></div><div><dt>Qualidade média</dt><dd>Umidade 13,8% · avariados 1,9%</dd></div><div><dt>Contrato de depósito</dt><dd>CD-2026-00041</dd></div><div><dt>Disponibilidade</dt><dd>164,20 t</dd></div></dl></article>
              </div>
            </DemoSection>

            <DemoSection kicker="LIVRO DE MOVIMENTOS" title="Entradas, saídas e reservas" id="movimentos" aside="ordem cronológica">
              <DemoTable label="Movimentos demonstrativos de estoque" columns={['Data', 'Movimento', 'Origem', 'Lote', 'Quantidade', 'Documento']} rows={movementRows} />
            </DemoSection>

            <DemoSection kicker="CONTROLE" title="Reconciliação físico × sistema" id="reconciliacao" aside="fechamento diário">
              <div className="inventory-reconciliation"><div><span>ARM-RV01</span><strong>2.228,800 t</strong><small>saldo operacional</small></div><b aria-hidden="true">=</b><div><span>Livro de estoque</span><strong>2.228,680 t</strong><small>movimentos contabilizados</small></div><b aria-hidden="true">+</b><div data-tone="attention"><span>Diferença</span><strong>0,120 t</strong><small>AJ-26-00031 em validação</small></div></div>
            </DemoSection>
          </div>

          <aside className="demo-side-stack">
            <section><p className="section-kicker">OCUPAÇÃO · ARM-RV01</p><h2>67% da capacidade</h2><div className="inventory-capacity"><span style={{ '--bar': '67%' } as CSSProperties} /><small>2.228,8 t de 3.300 t</small></div><dl className="summary-ledger"><div><dt>Silo 03</dt><dd>78%</dd></div><div><dt>Silo 04</dt><dd>59%</dd></div><div><dt>Moegas</dt><dd>12%</dd></div></dl></section>
            <section><p className="section-kicker">ATENÇÃO</p><div className="demo-alert" data-tone="attention"><strong>Ajuste aguardando validação</strong><p>Diferença de 120 kg entre a balança operacional e o livro do lote LT-JT-26-0108.</p></div></section>
            <section><p className="section-kicker">PRÓXIMA ENTRADA</p><h2>CG-26-10423</h2><p>Milho · 47,368 t previstas<br />07/10 às 08:00 · ARM-RV01</p><Link className="operational-link" href="/cargas?modo=demonstracao">Abrir agenda <span>→</span></Link></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
