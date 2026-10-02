import type { CSSProperties } from 'react';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { currentUserContext } from '../../lib/current-user';

const exposureRows = [
  ['Milho GO 25/26', '1.800 t', '2.400 t', '− 600 t', 'R$ 57,12/sc', '− R$ 186 mil', <DemoStatus tone="attention" key="s1">Descoberta</DemoStatus>],
  ['Soja GO 25/26', '2.950 t', '2.400 t', '+ 550 t', 'R$ 126,80/sc', '+ R$ 74 mil', <DemoStatus tone="positive" key="s2">Comprada</DemoStatus>],
  ['Milho MT 25/26', '1.200 t', '1.150 t', '+ 50 t', 'R$ 49,36/sc', '+ R$ 8 mil', <DemoStatus key="s3">Neutra</DemoStatus>],
];

const coverageRows = [
  ['Hedge B3 · CCMF27', 'Milho GO', 'Venda', '300 t', 'R$ 70,40/sc', '+ R$ 42.600', <DemoStatus tone="positive" key="c1">Ativo</DemoStatus>],
  ['Contrato físico CT-C-00512', 'Milho GO', 'Compra', '1.800 t', 'R$ 56,25/sc', '+ R$ 51.600', <DemoStatus tone="positive" key="c2">Ativo</DemoStatus>],
  ['Contrato físico CT-V-00208', 'Milho GO', 'Venda', '2.400 t', 'R$ 62,40/sc', '+ R$ 88.800', <DemoStatus tone="info" key="c3">Em entrega</DemoStatus>],
];

const exposureBars: Array<[string, string, number, 'positive' | 'attention']> = [
  ['Milho GO', '− 600 t', 72, 'attention'],
  ['Soja GO', '+ 550 t', 66, 'positive'],
  ['Milho MT', '+ 50 t', 12, 'positive'],
];

export default async function RiskPage() {
  const { userLabel } = await currentUserContext();

  return (
    <AppShell activeDomain="risk" userLabel={userLabel}>
      <DemoPageHeader domain="Risco" section="Posição" eyebrow="Exposição consolidada" title="Posição de risco" description="Exposição física, cobertura e marcação a mercado por commodity e praça." scope="Cotações de 01/10/2026 · 10:15" />
      <div className="demo-page demo-workspace">
        <DemoNotice />
        <div className="demo-alert" data-tone="attention"><strong>Cotações B3 com atraso de 15 minutos</strong><p>Os indicadores exibem a última referência registrada e não devem orientar decisões produtivas nesta demonstração.</p></div>
        <DemoMetricStrip items={[
          { label: 'Exposição líquida', value: '− 600', unit: 't', detail: 'milho GO 25/26', tone: 'attention' },
          { label: 'Resultado MTM', value: '− R$ 104 mil', detail: 'posição consolidada' },
          { label: 'Cobertura física', value: '75,0%', detail: '1.800 t de 2.400 t', tone: 'primary' },
          { label: 'Limite utilizado', value: '62%', detail: 'R$ 3,1 mi de R$ 5 mi' },
        ]} />

        <div className="demo-domain-layout">
          <div className="demo-main-stack">
            <DemoSection kicker="CARTEIRA" title="Exposição por mercado" id="exposicao" aside="posição física + hedge">
              <DemoTable label="Exposição demonstrativa de risco" columns={['Mercado', 'Compras', 'Vendas', 'Líquido', 'Referência', 'MTM', 'Situação']} rows={exposureRows} />
            </DemoSection>

            <DemoSection kicker="CONCENTRAÇÃO" title="Magnitude da posição líquida" aside="escala relativa">
              <div className="exposure-chart" aria-label="Exposição relativa por mercado">{exposureBars.map(([label, value, percent, tone]) => <div key={label}><span>{label}</span><div data-tone={tone}><i style={{ '--bar': `${percent}%` } as CSSProperties} /></div><strong>{value}</strong></div>)}</div>
            </DemoSection>

            <DemoSection kicker="INSTRUMENTOS" title="Cobertura e vínculos" id="cobertura" aside="origem da posição">
              <DemoTable label="Coberturas demonstrativas" columns={['Instrumento', 'Mercado', 'Lado', 'Volume', 'Preço', 'MTM', 'Status']} rows={coverageRows} />
            </DemoSection>
          </div>

          <aside className="demo-side-stack">
            <section id="limites"><p className="section-kicker">LIMITES DE RISCO</p><h2>Política PR-MI-02</h2><dl className="limit-ledger"><div><dt>Exposição nominal</dt><dd>R$ 3,1 mi</dd><span><i style={{ '--bar': '62%' } as CSSProperties} /></span><small>limite R$ 5,0 mi</small></div><div><dt>Posição descoberta</dt><dd>600 t</dd><span><i style={{ '--bar': '80%' } as CSSProperties} /></span><small>limite 750 t</small></div><div><dt>VaR demonstrativo</dt><dd>R$ 218 mil</dd><span><i style={{ '--bar': '44%' } as CSSProperties} /></span><small>limite R$ 500 mil</small></div></dl></section>
            <section><p className="section-kicker">EXCEÇÃO</p><div className="demo-alert" data-tone="attention"><strong>Milho GO próximo ao limite</strong><p>600 t vendidas ainda não possuem compra física ou hedge vinculado.</p></div><button className="tt-button" data-variant="primary" data-size="md" type="button" disabled>Simular cobertura</button></section>
            <section><p className="section-kicker">PREMISSAS</p><dl className="summary-ledger"><div><dt>Curva</dt><dd>B3 · CCMF27</dd></div><div><dt>Câmbio</dt><dd>PTAX 5,42</dd></div><div><dt>Base Rio Verde</dt><dd>− R$ 13,28/sc</dd></div><div><dt>Último cálculo</dt><dd>10:16</dd></div></dl></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
