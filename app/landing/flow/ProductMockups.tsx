'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { prefersReducedMotion, useInView, useTicker } from './hooks';
import { Ai, Cursor, LOGO } from './parts';
import {
  Bank,
  Book,
  Branch,
  CaretDown,
  CheckCircle,
  Coin,
  FileSheet,
  FileText,
  Flask,
  Funnel,
  Lightning,
  Receipt,
  Scale,
  Sparkle,
  Truck,
  Upload,
  Warehouse,
  Warning,
  Check,
} from './icons';

/* ───────── Barra superior do produto (forest + sublinhado leaf) ───────── */
const MODULES = ['Central', 'Comercial', 'Contratos', 'Operações', 'Estoque', 'Risco', 'Financeiro'];
export function ProductTopbar({ active, tabs, tab }: { active: string; tabs: string[]; tab: string }) {
  return (
    <>
      <div className="ui-topbar">
        <img src={LOGO.onDark} alt="" />
        <nav>
          {MODULES.map((m) => (
            <span key={m} className={m === active ? 'is-on' : ''}>
              {m}
            </span>
          ))}
        </nav>
        <span className="ui-topbar__me">
          <i>A</i> Ana Ribeiro
        </span>
      </div>
      <div className="ui-subnav">
        {tabs.map((t) => (
          <span key={t} className={t === tab ? 'is-on' : ''}>
            {t}
          </span>
        ))}
      </div>
    </>
  );
}

/* ───────── 5 · Contrato explodido em 3D ───────── */
type Node = { id: string; x: number; y: number; title: string; sub: string; icon: ReactNode; kind?: 'trigger' | 'drop' };
const NODES: Node[] = [
  { id: 'n1', x: 60, y: 50, title: 'Oferta aceita', sub: 'Agropecuária Boa Vista', icon: <Lightning size={15} />, kind: 'trigger' },
  { id: 'n2', x: 60, y: 160, title: 'Contrato assinado', sub: 'CT‑2026‑00512 · 30.000 sc', icon: <FileText size={15} /> },
  { id: 'n3', x: 60, y: 270, title: 'Carga 3 agendada', sub: '07/10 · 08:00 · pátio Rio Verde', icon: <Truck size={15} /> },
  { id: 'n4', x: 60, y: 380, title: 'Pesagem na balança', sub: '37.420 kg líquidos', icon: <Scale size={15} /> },
  { id: 'n5', x: 60, y: 490, title: 'Dentro do padrão?', sub: 'Laudo 0412', icon: <Branch size={15} /> },
  { id: 'n6', x: -130, y: 610, title: 'Liberado para estoque', sub: 'Sim · lote LT‑0415', icon: <Warehouse size={15} /> },
  { id: 'n7', x: 260, y: 610, title: 'Desconto por qualidade', sub: 'Não · 1,2% no contrato', icon: <Flask size={15} />, kind: 'drop' },
];
const NODE_W = 240;
const NODE_H = 52;
const OX = 300;

function wire(a: Node, b: Node) {
  const x1 = OX + a.x + NODE_W / 2;
  const y1 = a.y + NODE_H;
  const x2 = OX + b.x + NODE_W / 2;
  const y2 = b.y;
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
}

export function ContractScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const t = useTicker(2600, inView);
  const done = t % 2 === 1;

  useEffect(() => {
    const el = wrap.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
        el.style.setProperty('--p', p.toFixed(3));
      });
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const pairs: [string, string, boolean?][] = [
    ['n1', 'n2'],
    ['n2', 'n3'],
    ['n3', 'n4'],
    ['n4', 'n5'],
    ['n5', 'n6'],
    ['n5', 'n7', true],
  ];
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const mainPath = [wire(byId.n1, byId.n2), wire(byId.n2, byId.n3), wire(byId.n3, byId.n4), wire(byId.n4, byId.n5), wire(byId.n5, byId.n6)]
    .map((d, i) => (i === 0 ? d : d.replace(/^M/, 'L')))
    .join(' ');

  return (
    <div ref={wrap} className="fl-scene-wrap" aria-hidden="true">
      <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
      <div className="fl-scene">
        {/* camada 0 · app */}
        <div className="fl-layer mk-app ui" style={{ transform: 'translateZ(0)' }}>
          <ProductTopbar active="Contratos" tabs={['Contratos', 'Obrigações', 'Documentos', 'Entregas', 'Custos e margem']} tab="Contratos" />
          <div className="mk-app__main">
            <div className="mk-app__top">
              <b className="ui-mono" style={{ fontSize: 15, fontWeight: 650 }}>
                CT‑2026‑00512
              </b>
              <span className="ui-muted">Compra de milho · 30.000 sc · Agropecuária Boa Vista</span>
              <span className={`ui-chip ${done ? 'ui-chip--green' : 'ui-chip--blue'}`}>{done ? 'Pesagem registrada' : 'Em execução'}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <span className="ui-btn">Relatório</span>
                <span className="ui-btn ui-btn--blue">Registrar etapa</span>
              </span>
            </div>
            <div className="mk-canvas">
              <svg className="mk-wire" viewBox="0 0 1240 780" preserveAspectRatio="xMinYMin meet" style={{ width: 1240, height: 780 }}>
                {pairs.map(([a, b, isNew]) => (
                  <path key={a + b} d={wire(byId[a], byId[b])} className={isNew ? 'mk-wire--new' : ''} />
                ))}
                {!prefersReducedMotion() && (
                  <circle r="5" className="mk-pulse">
                    <animateMotion dur="5s" repeatCount="indefinite" path={mainPath} />
                  </circle>
                )}
              </svg>
              {NODES.map((n) => (
                <div
                  key={n.id}
                  className={`mk-node ${n.kind === 'trigger' ? 'mk-node--trigger' : ''} ${n.kind === 'drop' ? 'mk-node--drop' : ''}`}
                  style={{ left: OX + n.x, top: n.y, width: NODE_W, height: NODE_H }}
                >
                  <i>{n.icon}</i>
                  <span>
                    {n.title}
                    <small>{n.sub}</small>
                  </span>
                </div>
              ))}
              <Cursor label="Ana · Logística" color="#b98a3c" className="mk-node--drop" style={{ left: OX + 260 + 200, top: 640, border: 0 }} />
            </div>
          </div>
        </div>

        {/* camada 1 · carteira (esquerda) */}
        <div className="fl-layer mk-panel ui" style={{ left: -150, top: 150, width: 250, transform: 'translateZ(120px) translateY(calc(var(--p,0) * -30px))' }}>
          <h5>
            <Funnel size={15} /> Carteira
          </h5>
          {['Ofertas', 'Em negociação', 'Contratadas', 'Em execução', 'Liquidadas'].map((s, i) => (
            <div key={s} className="mk-funnel-row" style={{ background: i === 3 ? '#eef6e6' : undefined, color: i === 3 ? '#1f6b33' : undefined }}>
              <span style={{ fontWeight: 600 }}>{s}</span>
              <span className="ui-muted ui-mono">{[42, 28, 12, 6, 3][i]}</span>
            </div>
          ))}
        </div>

        {/* camada 2 · etapa (protagonista) */}
        <div className="fl-layer mk-panel ui" style={{ left: 1150, top: 170, width: 320, transform: 'translateZ(220px) translateY(calc(var(--p,0) * -60px))' }}>
          <h5>
            <Scale size={15} color="#b98a3c" /> Pesagem · carga 3
          </h5>
          <div className="mk-field">
            <label>Placa</label>
            <div className="ui-input ui-mono">RVD‑4E21</div>
          </div>
          <div className="mk-field">
            <label>Bruto · tara</label>
            <div className="ui-input ui-mono" style={{ justifyContent: 'space-between' }}>
              52.180 kg <span className="ui-muted">14.760 kg</span>
            </div>
          </div>
          <div className="mk-field">
            <label>Líquido</label>
            <div className="ui-input ui-mono" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
              37.420 kg <CaretDown size={12} />
            </div>
          </div>
          <div style={{ background: '#f8efdf', borderRadius: 4, padding: '9px 11px', fontSize: 12, color: '#5d4415', display: 'flex', gap: 8, marginBottom: 10 }}>
            <Sparkle size={14} style={{ color: '#b98a3c', marginTop: 1 }} />
            <span>IA conferiu o ticket com a NF‑e 4.512: os pesos batem.</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontWeight: 600 }}>Etapa concluída</span>
            <span className="ui-switch" style={{ background: done ? '#2f7a3e' : '#c9cec9', transition: 'background .3s' }} />
          </div>
          <Cursor label="Rafael · Gerente" style={{ left: 290, top: 330 }} />
        </div>

        {/* camada 3 · documentos */}
        <div className="fl-layer mk-panel ui" style={{ left: 1120, top: 600, width: 280, transform: 'translateZ(160px) translateY(calc(var(--p,0) * -40px))' }}>
          <h5>
            <FileText size={15} /> Documentos
          </h5>
          <div style={{ marginBottom: 8 }}>
            <Ai>Minuta gerada · 3 obrigações extraídas</Ai>
          </div>
          <div className="mk-lib">
            {(
              [
                [<FileText size={13} key="c" />, 'Confirmação de negócio'],
                [<Scale size={13} key="t" />, 'Ticket de balança'],
                [<Flask size={13} key="l" />, 'Laudo 0412'],
                [<Receipt size={13} key="n" />, 'NF‑e 4.512'],
              ] as [ReactNode, string][]
            ).map(([ic, l]) => (
              <div key={l}>
                <i>{ic}</i>
                {l}
                <CheckCircle size={13} style={{ marginLeft: 'auto', color: '#2f7a3e' }} />
              </div>
            ))}
          </div>
        </div>

        {/* camada 4 · próximo passo */}
        <div className="fl-layer mk-help ui" style={{ left: -120, top: 600, width: 400, transform: 'translateZ(90px) translateY(calc(var(--p,0) * -20px))' }}>
          <div>
            <Sparkle size={16} style={{ color: '#d6aa68' }} />
            <br />
            <b>Próximo passo pronto</b>
            <small>Agendar carga 4 · para Ana</small>
          </div>
          <div>
            <Book size={16} />
            <br />
            <b>Rastreabilidade ↗</b>
            <small>Da saca ao contrato</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 6 · Importação de planilha ───────── */
const IMPORT_LINES: { l: string; flag?: string }[] = [
  { l: 'CT‑00512, Agropecuária Boa Vista, Milho, 30.000 sc' },
  { l: 'CT‑00496, Aviagro Alimentos, Milho, 42.000 sc' },
  { l: 'CT‑00481, Fazenda Primavera, Soja, 18.500 sc' },
  { l: 'CT‑00481, Fazenda Primavera, Soja, 18.500 sc', flag: 'duplicado' },
  { l: 'CT‑00452, Cooperativa Vale Verde, Milho, 12.800 sc' },
  { l: 'CT‑00447, Agro Sorriso, Soja, 9.200 sc' },
  { l: 'CT‑00439, Grãos do Cerrado, Milho, 22.000 sc', flag: 'contraparte sem CNPJ' },
  { l: 'CT‑00431, Fazenda Três Rios, Soja, 15.000 sc' },
];
export function ImportLines() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(450, inView);
  const done = t % (IMPORT_LINES.length + 6);
  return (
    <div ref={ref} className="mk-import" aria-hidden="true">
      <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Upload size={15} /> contratos-safra-2026.xlsx · {Math.min(done, IMPORT_LINES.length)} de {IMPORT_LINES.length} lidos
      </div>
      {IMPORT_LINES.map((x, i) => (
        <div key={i} className={i < done ? 'is-done' : ''} style={x.flag && i < done ? { color: 'rgba(241,217,166,.9)' } : undefined}>
          {x.l}{' '}
          {x.flag ? (
            <em style={{ color: '#d6aa68', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <Sparkle size={11} /> {x.flag}
            </em>
          ) : (
            <em>✓ importado</em>
          )}
        </div>
      ))}
      <Cursor label="Você" color="#b98a3c" style={{ left: 300, top: 60 + Math.min(done, IMPORT_LINES.length - 1) * 34.6, transition: 'top .4s' }} />
    </div>
  );
}

/* ───────── 6 · Visão por função ───────── */
const ROLES = [
  { n: 'Comercial', d: 'Ofertas, negociações e carteira' },
  { n: 'Logística', d: 'Agenda de cargas, pátio e balança' },
  { n: 'Qualidade', d: 'Laudos, padrões e ocorrências' },
  { n: 'Financeiro', d: 'Liquidações, contas e conciliação' },
  { n: 'Diretoria', d: 'Margem, risco e aprovações' },
];
export function RolesSelector() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(2200, inView);
  const on = (t + 2) % ROLES.length;
  return (
    <div ref={ref} className="mk-roles ui" aria-hidden="true">
      <div className="mk-select">
        <div className="mk-select__head">
          Perfil de acesso <CaretDown size={12} />
        </div>
        {ROLES.map((r, i) => (
          <div key={r.n} className={`mk-select__opt ${i === on ? 'is-on' : ''}`} style={{ height: 'auto', padding: '9px 10px', alignItems: 'flex-start' }}>
            {i === on ? <Check size={13} style={{ marginTop: 2 }} /> : <span style={{ width: 13 }} />}
            <span>
              <b style={{ fontWeight: 600, display: 'block' }}>{r.n}</b>
              <span style={{ fontSize: 11, color: '#6b7571', fontWeight: 400 }}>{r.d}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mk-roles__legend">O que este usuário vê e aprova</div>
    </div>
  );
}

/* ───────── 7 · Extrato + conciliação automática ───────── */
const CHAIN: { l: string; v: string; off?: boolean; icon: ReactNode }[] = [
  { l: 'Contrato CT‑00496', v: 'R$ 2.679.600', icon: <FileText size={10} /> },
  { l: 'Carga 5 · ticket', v: '42.000 sc', icon: <Truck size={10} /> },
  { l: 'NF‑e 4.588', v: 'confere', icon: <Receipt size={10} /> },
  { l: 'CT‑e e MDF‑e', v: 'confere', icon: <Truck size={10} /> },
  { l: 'Título a receber', v: 'difere R$ 312', off: true, icon: <Warning size={10} /> },
  { l: 'Pagamento no extrato', v: 'R$ 2.679.288', icon: <Bank size={10} /> },
];
export function ConnectPanel() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(450, inView);
  const lit = t % (CHAIN.length + 6);
  return (
    <div ref={ref} style={{ position: 'relative', minHeight: 760 }}>
      <div className="ui ui-card mk-connect" style={{ position: 'relative', top: 110, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span className="ui-tile" style={{ background: '#0c3c33', color: '#9fe870', boxShadow: 'none' }}>
            <Bank size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <b style={{ fontWeight: 650 }}>Extrato bancário</b>
            <div className="ui-muted">Conta movimento · OFX ou CSV</div>
          </div>
          <span className="ui-btn ui-btn--blue">Importar</span>
        </div>
        <div className="mk-field">
          <label>Conciliar com</label>
          <div className="ui-input" style={{ gap: 6, height: 'auto', padding: 6, flexWrap: 'wrap' }}>
            {['Liquidações', 'Contas a receber', 'Contas a pagar'].map((n) => (
              <span key={n} className="ui-chip ui-chip--green">
                {n} ×
              </span>
            ))}
          </div>
        </div>
        <div className="mk-chain">
          <div className="mk-chain__head">
            <Ai>Conciliação automática</Ai>
            <span className="ui-muted ui-mono">{Math.min(lit, CHAIN.length)}/{CHAIN.length}</span>
          </div>
          {CHAIN.map((c, i) => (
            <div key={c.l} className={`mk-chain__row ${c.off ? 'is-off' : ''} ${i < lit ? 'is-on' : ''}`}>
              <i>{c.icon}</i>
              <span>{c.l}</span>
              <em className="ui-mono">{c.v}</em>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <span className="ui-chip">
            <CheckCircle size={11} /> Modelo de extrato pronto
          </span>
          <span className="ui-chip">
            <CheckCircle size={11} /> Exporta CSV e relatórios
          </span>
        </div>
      </div>
      {[
        { l: 10, t: 30, bg: 'linear-gradient(140deg,#5fcf7f,#1f8a45)', el: <FileSheet size={36} />, d: '0s', r: '6deg' },
        { l: 470, t: 10, bg: 'linear-gradient(140deg,#1c5a48,#062f28)', el: <Receipt size={36} />, d: '-1.4s', r: '-5deg', c: '#9fe870' },
        { l: 520, t: 600, bg: 'linear-gradient(140deg,#f0cf8f,#b98a3c)', el: <Scale size={36} />, d: '-2.2s', r: '4deg' },
        { l: 0, t: 560, bg: '#fff', el: <Flask size={36} />, d: '-3s', r: '-4deg', c: '#2f7a3e' },
        { l: 290, t: 690, bg: 'linear-gradient(140deg,#2b3b35,#04110d)', el: <Bank size={36} />, d: '-.7s', r: '5deg', c: '#9fe870' },
      ].map((ic, i) => (
        <div
          key={i}
          className="mk-icon3d"
          aria-hidden="true"
          style={{ left: ic.l, top: ic.t, background: ic.bg, color: ic.c ?? '#fff', ['--dl' as string]: ic.d, ['--r' as string]: ic.r, ['--t' as string]: `${5 + i * 0.6}s` }}
        >
          {ic.el}
        </div>
      ))}
    </div>
  );
}

/* ───────── 10 · Central de trabalho em leque ───────── */
export function FanCards() {
  return (
    <div className="mk-fan ui" aria-hidden="true">
      <div className="mk-fan__flag">
        <Ai>Ordenado por impacto financeiro</Ai>
      </div>
      <div className="ui-card" style={{ left: 0, top: 0, transform: 'rotate(-6deg)' }}>
        <div className="mk-msg__top">
          <Sparkle size={13} style={{ color: '#b98a3c' }} /> IA · Divergência encontrada
        </div>
        <b style={{ fontWeight: 650, fontSize: 14 }}>NF‑e com 320 kg a menos que o ticket</b>
        <div className="ui-muted" style={{ marginTop: 4 }}>
          Impacto R$ 1.940 · correção sugerida · CT‑00512
        </div>
      </div>
      <div className="ui-card" style={{ left: 120, top: 70, transform: 'rotate(3deg)' }}>
        <div className="mk-msg__top">
          <Coin size={13} /> Oferta abaixo da política
        </div>
        <b style={{ fontWeight: 650, fontSize: 14 }}>Milho · 8.000 sc · margem 4,1%</b>
        <div className="ui-muted" style={{ marginTop: 4 }}>
          Aviagro Alimentos · trader Ana Ribeiro
        </div>
      </div>
      <div className="ui-card" style={{ left: 50, top: 150, transform: 'rotate(-1deg)', boxShadow: '0 30px 70px rgba(4,17,13,.2)' }}>
        <div className="mk-msg__top">
          <Bank size={13} /> Liquidação aguardando aprovação
        </div>
        <b className="ui-mono" style={{ fontWeight: 650, fontSize: 14 }}>
          R$ 1.284.600 · CT‑2026‑00496
        </b>
        <div className="ui-muted" style={{ marginTop: 4 }}>
          Preparada pela IA · memória de cálculo anexada
        </div>
        <div className="mk-fan__actions">
          <span className="ui-btn">Recusar</span>
          <span className="ui-btn ui-btn--blue">Aprovar</span>
        </div>
      </div>
    </div>
  );
}
