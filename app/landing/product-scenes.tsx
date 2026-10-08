'use client';

import { useEffect, useRef, useState } from 'react';
import s from './product-scenes.module.css';

type Domain = 'Comercial' | 'Contratos' | 'Operações' | 'Estoque' | 'Risco' | 'Financeiro';
const domains: Domain[] = ['Comercial', 'Contratos', 'Operações', 'Estoque', 'Risco', 'Financeiro'];

function useTour(length: number, delay = 2400) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setStep(length - 1); return; }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [length]);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => { if (!document.hidden) setStep((value) => (value + 1) % length); }, delay);
    return () => window.clearInterval(timer);
  }, [visible, delay, length]);
  return { ref, step, setStep };
}

function Chrome({ active, compact = false }: { active: Domain; compact?: boolean }) {
  return <div className={`${s.chrome} ${compact ? s.chromeCompact : ''}`}><strong>tier trade</strong><nav aria-label="Módulos ilustrativos">{domains.map((item) => <span key={item} className={item === active ? s.navActive : ''}>{item}</span>)}</nav><small>Safra 25/26</small></div>;
}

type Row = { id: string; name: string; value: string; status: string; detail: string; result: string };
type Kind = 'offer' | 'contract' | 'load' | 'stock' | 'risk';
const miniData: Record<Kind, { domain: Domain; eyebrow: string; title: string; subtitle: string; metric: string; metricLabel: string; rows: Row[] }> = {
  offer: { domain: 'Comercial', eyebrow: 'Mesa comercial / ofertas', title: 'Decidir com margem à vista', subtitle: 'Ofertas abertas · Rio Verde', metric: 'R$ 3,40/sc', metricLabel: 'Margem projetada', rows: [
    { id: 'OF-0231', name: 'Boa Vista · Milho', value: '30.000 sc', status: 'Aprovar', detail: 'Preço negociado · R$ 56,25/sc', result: 'Margem dentro da política' },
    { id: 'OF-0228', name: 'Coop. Central · Soja', value: '12.400 sc', status: 'Em análise', detail: 'Preço negociado · R$ 119,80/sc', result: 'Aguardando alçada' },
    { id: 'OF-0217', name: 'Fazenda Horizonte', value: '8.600 sc', status: 'Aprovada', detail: 'Preço negociado · R$ 57,10/sc', result: 'Contrato pronto para emitir' },
  ] },
  contract: { domain: 'Contratos', eyebrow: 'Carteira / execução', title: 'O contrato já nasce conectado', subtitle: 'Compra de milho · Safra 25/26', metric: '94,7%', metricLabel: 'Saldo a entregar', rows: [
    { id: 'CT-00512', name: 'Boa Vista · Milho', value: '30.000 sc', status: 'Em execução', detail: 'Origem · OF-2026-0231', result: '28.411,9 sc ainda a entregar' },
    { id: 'CT-00496', name: 'Coop. Central · Soja', value: '12.400 sc', status: 'Programar', detail: 'Origem · OF-2026-0228', result: 'Agenda ainda não definida' },
    { id: 'CT-00481', name: 'Fazenda Horizonte', value: '8.600 sc', status: 'Atenção', detail: 'Obrigação documental', result: 'Inscrição estadual vence hoje' },
  ] },
  load: { domain: 'Operações', eyebrow: 'Execução / cargas', title: 'Da agenda à conferência', subtitle: 'Recebimento · Rio Verde', metric: '47.368 kg', metricLabel: 'Peso líquido da carga', rows: [
    { id: 'CG-10421', name: '07:30 · Rodogrãos', value: '46.840 kg', status: 'Recebida', detail: 'Lote · ARM-RV01', result: 'Qualidade aprovada' },
    { id: 'CG-10422', name: '08:00 · Rodogrãos', value: '47.368 kg', status: 'Conferir', detail: 'Umidade · 15,4% → 15,1%', result: 'Contraprova registrada' },
    { id: 'CG-10423', name: '08:30 · Transmilho', value: '47.100 kg', status: 'Agendada', detail: 'Contrato · CT-2026-00512', result: 'Aguardando chegada' },
  ] },
  stock: { domain: 'Estoque', eyebrow: 'Posição / lotes', title: 'Cada volume tem origem', subtitle: 'Milho · Unidade Rio Verde', metric: '1.588 sc', metricLabel: 'Recebido no contrato', rows: [
    { id: 'ARM-RV01', name: 'Lote 01 · Milho', value: '789 sc', status: 'Disponível', detail: 'Carga · CG-26-10422', result: 'Titularidade Boa Vista' },
    { id: 'ARM-RV02', name: 'Lote 02 · Milho', value: '799 sc', status: 'Disponível', detail: 'Carga · CG-26-10421', result: 'Contrato CT-2026-00512' },
    { id: 'ARM-RV03', name: 'Lote 03 · Milho', value: '0 sc', status: 'Previsto', detail: 'Carga · CG-26-10423', result: 'Entrada programada' },
  ] },
  risk: { domain: 'Risco', eyebrow: 'Exposição / posição', title: 'Físico e financeiro na mesma leitura', subtitle: 'Milho · Safra 25/26', metric: '68%', metricLabel: 'Cobertura da posição', rows: [
    { id: 'POS-01', name: 'Compra contratada', value: '30.000 sc', status: 'Origem', detail: 'Contratos de compra', result: 'CT-2026-00512 incluído' },
    { id: 'POS-02', name: 'Físico recebido', value: '1.588 sc', status: 'Atualizado', detail: 'Cargas e estoque', result: 'Recebimento conciliado' },
    { id: 'POS-03', name: 'Cobertura financeira', value: '20.400 sc', status: 'Protegido', detail: 'Hedge da operação', result: 'Exposição recalculada' },
  ] },
};

function MicroChart({ kind, step }: { kind: Kind; step: number }) {
  if (kind === 'offer' || kind === 'risk') return <div className={s.chart} aria-hidden="true"><div className={s.chartGrid}><i /><i /><i /></div><svg viewBox="0 0 320 74" preserveAspectRatio="none"><path d="M0 64 C43 60 55 49 97 51 S151 29 194 36 S251 12 320 10" /><path className={s.chartAccent} d="M0 69 C51 64 66 57 109 55 S169 47 201 37 S260 35 320 23" /></svg><div className={s.chartPointer} style={{ left: `${22 + step * 23}%` }} /></div>;
  return <div className={s.bars} aria-hidden="true">{[36, 55, 43, 72, 52, 88, 64, 79, 57, 94].map((height, index) => <span key={index} style={{ height: `${height}%` }} data-lit={index <= 2 + step * 2} />)}</div>;
}

function MiniScene({ kind }: { kind: Kind }) {
  const data = miniData[kind];
  const { ref, step, setStep } = useTour(data.rows.length, 2500);
  const current = data.rows[step];
  return <div ref={ref} className={s.mini} data-kind={kind} data-step={step}>
    <Chrome active={data.domain} compact />
    <div className={s.subnav}><span className={s.subnavActive}>{data.eyebrow.split(' / ')[0]}</span><span>{data.eyebrow.split(' / ')[1]}</span><span className={s.subnavRight}>● Ao vivo</span></div>
    <div className={s.miniBody}><header><div><small>{data.eyebrow}</small><h3>{data.title}</h3><p>{data.subtitle}</p></div><span className={s.miniCount}>03 registros</span></header>
      <div className={s.miniContent}><div className={s.miniMain}><div className={s.miniMetric}><span>{data.metricLabel}</span><strong>{data.metric}</strong><MicroChart kind={kind} step={step} /></div><div className={s.tableScroll}><table><thead><tr><th>Referência</th><th>Operação</th><th>Volume</th></tr></thead><tbody>{data.rows.map((row, index) => <tr key={row.id} className={index === step ? s.rowSelected : ''} onClick={() => setStep(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setStep(index); } }} tabIndex={0} aria-selected={index === step}><td>{row.id}</td><td>{row.name}</td><td>{row.value}</td></tr>)}</tbody></table></div></div>
        <aside className={s.miniDetail} key={current.id}><small>DETALHE DA LINHA SELECIONADA</small><strong>{current.id}</strong><span>{current.name}</span><div><small>STATUS</small><b>{current.status}</b></div><div><small>CONTEXTO</small><b>{current.detail}</b></div><p>{current.result}</p><em>Ver operação completa ↗</em></aside></div>
    </div>
  </div>;
}

export function OfferScene() { return <MiniScene kind="offer" />; }
export function ContractScene() { return <MiniScene kind="contract" />; }
export function LoadScene() { return <MiniScene kind="load" />; }
export function StockScene() { return <MiniScene kind="stock" />; }
export function RiskScene() { return <MiniScene kind="risk" />; }

const stages: { domain: Domain; title: string; note: string; metric: string; label: string; ref: string }[] = [
  { domain: 'Comercial', title: 'Oferta aprovada', note: 'Preço, margem e alçada registrados antes do aceite.', metric: 'R$ 3,40/sc', label: 'Margem preservada', ref: 'OF-2026-0231' },
  { domain: 'Contratos', title: 'Contrato emitido', note: 'Saldo e obrigações nascem da oferta aprovada.', metric: '30.000 sc', label: 'Volume contratado', ref: 'CT-2026-00512' },
  { domain: 'Operações', title: 'Carga em contraprova', note: 'Medição original e revisão permanecem no histórico.', metric: '15,4 → 15,1%', label: 'Umidade revisada', ref: 'CG-26-10422' },
  { domain: 'Estoque', title: 'Lote atualizado', note: 'Carga conferida altera a posição física vinculada ao contrato.', metric: '1.588 sc', label: 'Recebido', ref: 'ARM-RV01' },
  { domain: 'Risco', title: 'Exposição revista', note: 'A cobertura é recalculada quando o físico muda.', metric: '68%', label: 'Posição coberta', ref: 'POS-2026-041' },
  { domain: 'Financeiro', title: 'Liquidação pronta', note: 'O cálculo chega ao caixa com origem e descontos rastreáveis.', metric: 'R$ 89.330', label: 'Valor a liquidar', ref: 'LIQ-2026-118' },
];

export function WorkflowScene() {
  const { ref, step, setStep } = useTour(stages.length, 2450);
  const stage = stages[step];
  return <div ref={ref} className={s.workflow} data-step={step} role="group" aria-label="Demonstração do percurso de uma operação, da oferta à liquidação"><Chrome active={stage.domain} /><div className={s.workflowSub}><span>Operação / CT-2026-00512</span><span>Compra de milho · Rio Verde</span><b>Em andamento</b></div><div className={s.workflowBody}>
    <div className={s.workflowJourney}><small>PERCURSO DA OPERAÇÃO</small><h3>Uma decisão move a próxima.</h3><div className={s.stageList}>{stages.map((item, index) => <button type="button" key={item.ref} className={index === step ? s.stageActive : ''} onClick={() => setStep(index)}><i>{String(index + 1).padStart(2, '0')}</i><span><strong>{item.title}</strong><small>{item.domain}</small></span><em>{index < step ? '✓' : '↗'}</em></button>)}</div></div>
    <div className={s.workflowEvidence} key={stage.ref}><div className={s.evidenceTop}><small>{stage.domain.toUpperCase()} / DETALHE DA ETAPA</small><span>{stage.ref}</span></div><h4>{stage.title}</h4><p>{stage.note}</p><div className={s.evidenceChart}><span>{stage.label}</span><strong>{stage.metric}</strong><div><i style={{ width: `${35 + step * 10}%` }} /></div></div><div className={s.evidenceTable}><div><span>Contrato de origem</span><b>CT-2026-00512</b></div><div><span>Contraparte</span><b>Agropecuária Boa Vista</b></div><div><span>Safra / commodity</span><b>25/26 · Milho</b></div><div><span>Próxima área</span><b>{stages[(step + 1) % stages.length].domain}</b></div></div><div className={s.evidenceFoot}><span>↗</span> O vínculo continua na próxima etapa</div></div>
  </div><div className={s.workflowBottom}><span>OF-2026-0231</span><i /><span>CT-2026-00512</span><i /><span>CG-26-10422</span><i /><span>ARM-RV01</span></div></div>;
}

export function IntakeScene() { const { ref, step } = useTour(3, 1900); return <div ref={ref} className={s.support} data-step={step}><div className={s.supportTop}>FONTE ÚNICA DA OPERAÇÃO <span>↗</span></div>{[['Oferta', 'OF-2026-0231', 'Preço e margem'], ['Contrato', 'CT-2026-00512', 'Saldo e obrigações'], ['Carga', 'CG-26-10422', 'Peso e qualidade']].map(([title, id, text], i) => <div key={id} className={`${s.supportRow} ${i === step ? s.supportActive : ''}`}><span>0{i + 1}</span><b>{title}</b><small>{id}</small><em>{text}</em></div>)}<p>O dado entra uma vez. O contexto segue adiante.</p></div>; }
export function RolesScene() { const { ref, step } = useTour(3, 2400); return <div ref={ref} className={s.support}><div className={s.supportTop}>VISÕES POR FUNÇÃO <span>↗</span></div><div className={s.rolesTabs}>{['Comercial', 'Operações', 'Gestão'].map((name, i) => <span key={name} className={step === i ? s.rolesActive : ''}>{name}</span>)}</div><div className={s.rolesAnswer} key={step}><small>PERGUNTA DO DIA</small><strong>{['Esta oferta avança com margem?', 'Qual carga pede atenção?', 'Onde a posição mudou?'][step]}</strong><p>{['Preço · alçada · contraparte', 'Agenda · qualidade · estoque', 'Risco · liquidação · caixa'][step]}</p></div></div>; }

export function TraceScene() { const { ref, step } = useTour(3, 2100); return <div ref={ref} className={s.trace}><Chrome active={['Operações', 'Estoque', 'Financeiro'][step] as Domain} compact /><div className={s.traceBody}><small>RASTREABILIDADE / CT-2026-00512</small><h3>Da carga ao caixa, com a mesma origem.</h3><div className={s.traceProgress}>{['Recebimento', 'Estoque', 'Liquidação'].map((name, i) => <span key={name} className={i === step ? s.traceActive : ''}>{String(i + 1).padStart(2, '0')} / {name}</span>)}</div><div className={s.traceData} key={step}><span>{['CG-26-10422', 'ARM-RV01', 'LIQ-2026-118'][step]}</span><strong>{['Qualidade conferida', 'Posição conciliada', 'Memória de cálculo'][step]}</strong><div><p>{['Peso líquido', 'Lote vinculado', 'Contrato de origem'][step]}</p><b>{['47.368 kg', 'CT-2026-00512', 'CT-2026-00512'][step]}</b></div><div><p>{['Umidade / contraprova', 'Titularidade', 'Valor líquido'][step]}</p><b>{['15,4% → 15,1%', 'Boa Vista', 'R$ 89.330'][step]}</b></div></div></div></div>; }

const portfolioRows = [
  ['CT-2026-00512', 'Boa Vista', 'Milho', '30.000 sc', '1.588 sc', 'Em execução'],
  ['CT-2026-00496', 'Coop. Central', 'Soja', '12.400 sc', '0 sc', 'Programar'],
  ['CT-2026-00481', 'Horizonte', 'Milho', '8.600 sc', '4.210 sc', 'Documento'],
  ['CT-2026-00473', 'Agro Cerrado', 'Sorgo', '6.200 sc', '6.200 sc', 'Concluído'],
];
export function PortfolioScene() { const { ref, step, setStep } = useTour(4, 2500); const row = portfolioRows[step]; return <div ref={ref} className={s.wide}><Chrome active="Contratos" /><div className={s.wideSub}>Carteira contratual <span>Safra 25/26 · Rio Verde</span></div><div className={s.wideBody}><div className={s.wideHeading}><div><small>CONTRATOS / CARTEIRA</small><h3>Uma carteira em movimento.</h3></div><span>04 contratos</span></div><div className={s.wideGrid}><div className={s.wideTableScroll}><table><thead><tr><th>Contrato</th><th>Contraparte</th><th>Produto</th><th>Contratado</th><th>Entregue</th><th>Situação</th></tr></thead><tbody>{portfolioRows.map((item, i) => <tr key={item[0]} className={i === step ? s.rowSelected : ''} onClick={() => setStep(i)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setStep(i); } }} tabIndex={0} aria-selected={i === step}>{item.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div><aside className={s.wideDrawer} key={row[0]}><small>CONTRATO SELECIONADO</small><strong>{row[0]}</strong><span>{row[1]} · {row[2]}</span><div><small>CONTRATADO</small><b>{row[3]}</b></div><div><small>ENTREGUE</small><b>{row[4]}</b></div><div className={s.drawerProgress}><i style={{ width: `${[18, 3, 49, 100][step]}%` }} /></div><p>{['Carga conferida. Estoque e risco atualizados.', 'Agenda ainda sem programação.', 'Obrigação documental próxima do vencimento.', 'Execução concluída e pronta para liquidação.'][step]}</p></aside></div></div></div>; }

export function ManagementScene() { const { ref, step, setStep } = useTour(4, 2600); return <div ref={ref} className={`${s.wide} ${s.management}`}><Chrome active="Risco" /><div className={s.wideSub}>Inteligência / posição consolidada <span>Safra 25/26 · atualizado agora</span></div><div className={s.wideBody}><div className={s.wideHeading}><div><small>ANÁLISE GERENCIAL</small><h3>O impacto aparece antes da próxima decisão.</h3></div><span>Rio Verde · Milho</span></div><div className={s.analysisGrid}><div className={s.analysisMain}><div className={s.analysisSummary}><span>Exposição física</span><strong>28.412 sc</strong><small>− 1.588 sc após a última carga</small></div><div className={s.analysisChart}><div className={s.axisLabels}><span>30k</span><span>20k</span><span>10k</span><span>0</span></div><div className={s.chartPlot}><div className={s.plotLines}><i /><i /><i /><i /></div>{[60, 66, 57, 75, 70, 85, 63, 90].map((height, i) => <div key={i} className={s.plotBar} style={{ height: `${height}%` }} data-lit={i <= step + 3} />)}</div></div><div className={s.chartLegend}><span>● Posição contratada</span><span>● Físico recebido</span><span>● Cobertura</span></div></div><aside className={s.analysisAside}><small>LEITURA DA OPERAÇÃO</small><strong>{['Compra aprovada', 'Carga conferida', 'Estoque conciliado', 'Exposição revista'][step]}</strong><p>{['Margem preservada no contrato.', 'O físico recebido já altera o saldo.', 'Lote e titularidade ligados à carga.', 'Gestão vê o impacto sem reconstruir planilhas.'][step]}</p><div className={s.analysisNumbers}><span>Compra contratada <b>30.000 sc</b></span><span>Físico recebido <b>1.588 sc</b></span><span>Cobertura <b>68%</b></span></div></aside></div><div className={s.analysisTimeline}>{['Oferta', 'Contrato', 'Carga', 'Estoque'].map((label, i) => <button key={label} type="button" onClick={() => setStep(i)} className={step === i ? s.analysisActive : ''}><span>0{i + 1}</span>{label}</button>)}</div></div></div>; }
