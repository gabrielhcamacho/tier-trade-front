import Link from 'next/link';
import type { CSSProperties } from 'react';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';

const loadRows = [
  [<Link href="/cargas/CG-26-10421?modo=demonstracao" key="l1">CG-26-10421</Link>, '06/10 · 08:30', 'QAB-2J41', 'Transmil', '47.368 kg', '48.000 kg', '0,00%', <DemoStatus tone="positive" key="s1">Recebida</DemoStatus>],
  [<Link href="/cargas/CG-26-10422?modo=demonstracao" key="l2">CG-26-10422</Link>, '06/10 · 10:30', 'RBC-7H55', 'Rodogrãos', '47.368 kg', '47.620 kg', '1,95%', <DemoStatus tone="attention" key="s2">Contraprova</DemoStatus>],
  [<Link href="/cargas/CG-26-10423?modo=demonstracao" key="l3">CG-26-10423</Link>, '07/10 · 08:00', 'SDF-4K12', 'Expresso Cerrado', '47.368 kg', '—', '—', <DemoStatus tone="info" key="s3">Programada</DemoStatus>],
  [<Link href="/cargas/CG-26-10424?modo=demonstracao" key="l4">CG-26-10424</Link>, '07/10 · 10:00', 'TGH-9A20', 'Transmil', '47.368 kg', '—', '—', <DemoStatus key="s4">Aguardando</DemoStatus>],
  [<Link href="/cargas/CG-26-10425?modo=demonstracao" key="l5">CG-26-10425</Link>, '08/10 · 08:30', 'UJK-3C18', 'Vale Log', '47.368 kg', '—', '—', <DemoStatus key="s5">Aguardando</DemoStatus>],
];

const capacity: Array<[string, number, number]> = [
  ['06/10', 96, 8],
  ['07/10', 284, 24],
  ['08/10', 426, 36],
  ['09/10', 711, 59],
  ['10/10', 568, 47],
  ['11/10', 332, 28],
];

export function DemoLoadsAgenda() {
  return (
    <>
      <DemoPageHeader domain="Operações" section="Agenda de cargas" eyebrow="Execução física" title="Agenda de cargas · Unidade Rio Verde" description="Recebimento rodoviário, qualidade e saldo contratual organizados por janela." scope="ARM-RV01 · capacidade 1.200 t/dia" />
      <div className="demo-page demo-workspace">
        <DemoNotice />
        <section className="loads-contract-bar" aria-label="Contrato demonstrativo selecionado"><div><span className="section-kicker">CONTRATO SELECIONADO</span><strong>CT-2026-00512</strong></div><dl><div><dt>Commodity</dt><dd>Milho</dd></div><div><dt>Volume</dt><dd>30.000 sc</dd></div><div><dt>Janela</dt><dd>06/10 a 28/11</dd></div><div><dt>Status</dt><dd><DemoStatus tone="positive">Ativo</DemoStatus></dd></div></dl><Link href="/contratos?modo=demonstracao">Abrir contratos</Link></section>
        <DemoMetricStrip items={[
          { label: 'Cargas do contrato', value: '38', detail: '06/10 a 28/11' },
          { label: 'Recebidas', value: '2', detail: '95.620 kg líquidos', tone: 'primary' },
          { label: 'Em qualidade', value: '1', detail: 'contraprova aberta', tone: 'attention' },
          { label: 'Recepção hoje', value: '96', unit: 't', detail: '8% da capacidade diária' },
        ]} />

        <div className="demo-filterbar"><span>Contrato <strong>CT-2026-00512</strong></span><span>Período <strong>06/10 a 28/11</strong></span><span>Destino <strong>ARM-RV01</strong></span><span>Status <strong>Todos</strong></span></div>

        <div className="demo-domain-layout">
          <div className="demo-main-stack">
            <DemoSection kicker="PROGRAMAÇÃO OPERACIONAL" title="Próximas cargas" aside="5 de 38 cargas">
              <DemoTable label="Agenda demonstrativa de cargas" columns={['Carga', 'Janela', 'Placa', 'Transportadora', 'Previsto', 'Líquido', 'Desconto', 'Status']} rows={loadRows} />
              <div className="demo-table-actions"><span>As demais 33 cargas seguem a cadência acordada até 28/11.</span><button className="tt-button" data-variant="primary" data-size="md" type="button" disabled>Programar carga</button></div>
            </DemoSection>

            <DemoSection kicker="CAPACIDADE" title="Ocupação da recepção" aside="Toneladas por dia">
              <div className="capacity-chart" aria-label="Capacidade de recepção por dia">
                {capacity.map(([day, amount, percent]) => <div key={day}><span>{day}</span><div><i style={{ '--bar': `${percent}%` } as CSSProperties} /></div><strong>{amount} t</strong></div>)}
              </div>
            </DemoSection>
          </div>

          <aside className="demo-side-stack">
            <section><p className="section-kicker">JANELA ATUAL</p><h2>06/10 · manhã</h2><dl className="summary-ledger"><div><dt>Programado</dt><dd>94.736 kg</dd></div><div><dt>Recebido</dt><dd>95.620 kg</dd></div><div><dt>Veículos</dt><dd>2</dd></div><div><dt>Fila atual</dt><dd>1 veículo</dd></div></dl></section>
            <section><p className="section-kicker">EXCEÇÃO EM ABERTO</p><div className="demo-alert" data-tone="attention"><strong>Contraprova de umidade</strong><p>CG-26-10422 · medição original 15,4%; contraprova 15,1%.</p></div><Link className="operational-link" href="/cargas/CG-26-10422?modo=demonstracao">Analisar carga <span>→</span></Link></section>
            <section><p className="section-kicker">SALDO CONTRATUAL</p><dl className="summary-ledger"><div><dt>Contratado</dt><dd>30.000 sc</dd></div><div><dt>Recebido</dt><dd>1.588,1 sc</dd></div><div><dt>Programado</dt><dd>2.368,4 sc</dd></div><div><dt>Disponível</dt><dd>26.043,5 sc</dd></div></dl></section>
          </aside>
        </div>
      </div>
    </>
  );
}
