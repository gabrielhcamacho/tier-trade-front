'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useInView, useTicker } from './hooks';
import { Ai, Cursor } from './parts';
import { CaretDown, Chat, Check, CheckCircle, Clock, Envelope, FilePdf, FileSheet, FileText, Flask, Scale, Send, Users } from './icons';

/* Todos os nomes, placas, valores e empresas são fictícios. */

type Channel = { name: string; icon: ReactNode; bg: string };
const CHANNELS: Channel[] = [
  { name: 'e-mail', icon: <Envelope size={17} />, bg: '#2f7a3e' },
  { name: 'WhatsApp', icon: <Chat size={17} />, bg: '#25a35a' },
  { name: 'PDF do corretor', icon: <FilePdf size={17} />, bg: '#c5442b' },
  { name: 'planilha', icon: <FileSheet size={17} />, bg: '#1f6b33' },
];
const OFFERS = [
  { who: 'Agropecuária Boa Vista', what: 'Milho', qty: '30.000 sc', where: 'FOB Rio Verde/GO', price: 'R$ 56,25' },
  { who: 'Cooperativa Vale Verde', what: 'Milho', qty: '12.800 sc', where: 'CIF Uberlândia/MG', price: 'R$ 58,10' },
  { who: 'Fazenda Primavera', what: 'Soja', qty: '18.500 sc', where: 'FOB Sorriso/MT', price: 'R$ 121,40' },
  { who: 'Agro Sorriso', what: 'Soja', qty: '9.200 sc', where: 'FOB Lucas do Rio Verde/MT', price: 'R$ 119,80' },
  { who: 'Grãos do Cerrado', what: 'Milho', qty: '22.000 sc', where: 'FOB Jataí/GO', price: 'R$ 55,40' },
  { who: 'Sementes Santa Luzia', what: 'Soja', qty: '6.400 sc', where: 'CIF Paranaguá/PR', price: 'R$ 128,60' },
];

/** A · esquerda — oferta chegando por um canal, lida pela IA e precificada. */
export function OfferArriving() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const sec = useTicker(1000, inView);
  const i = Math.floor(sec / 3) % OFFERS.length;
  const ch = CHANNELS[i % CHANNELS.length];
  const o = OFFERS[i];
  const elapsed = 12 + (sec % 3);
  const bars = [38, 52, 44, 61, 57, 70, 66, 82, 74, 90].map((h, k) => Math.min(100, h + ((k * 7 + i * 13) % 11)));
  return (
    <div ref={ref} className="ui ui-card mk-lead fl-float">
      <div className="mk-lead__head mk-lead__swap" key={i}>
        <span className="ui-tile" style={{ background: ch.bg, boxShadow: 'none' }}>
          {ch.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 650, fontSize: 14 }}>{o.who}</div>
          <div className="ui-muted">
            via {ch.name} · {o.what} · {o.where}
          </div>
        </div>
        <span className="ui-chip ui-chip--lime">Nova</span>
      </div>
      <div className="mk-lead__offer mk-lead__swap" key={`o${i}`}>
        <div>
          <span>Volume</span>
          <b className="ui-mono">{o.qty}</b>
        </div>
        <div>
          <span>Preço</span>
          <b className="ui-mono">{o.price}/sc</b>
        </div>
        <div className="is-check">
          <span>Entrega · confira</span>
          <b>out–nov</b>
        </div>
      </div>
      <div className="mk-lead__bars" aria-hidden="true">
        {bars.map((h, k) => (
          <i key={k} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="ui-muted" style={{ fontSize: 11, marginBottom: 12 }}>
        Ofertas recebidas nos últimos 10 dias
      </div>
      <div className="mk-lead__foot">
        <span className="ui-muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Clock size={14} /> chegou há 00:{String(elapsed).padStart(2, '0')}
        </span>
        <span className="ui-chip ui-chip--green">
          <Check size={12} /> Margem 4,8% calculada
        </span>
      </div>
      <div style={{ position: 'absolute', top: -14, right: 18 }}>
        <Ai dark style={{ height: 28, padding: '0 12px' }}>
          IA preencheu 9 campos · confira 1
        </Ai>
      </div>
    </div>
  );
}

type KCardData = { n: string; r: string; c: 'MI' | 'SJ'; t: string; a: string };
const COMMODITY: Record<KCardData['c'], string> = { MI: '#c99a3e', SJ: '#7f9a3a' };
const COLS: { title: string; c: string; extra: number; cards: KCardData[] }[] = [
  {
    title: 'Nova oferta',
    c: '#2f7a3e',
    extra: 9,
    cards: [
      { n: 'Agropecuária Boa Vista', r: 'Milho · 30.000 sc', c: 'MI', t: 'R$ 56,25', a: 'AR' },
      { n: 'Grãos do Cerrado', r: 'Milho · 22.000 sc', c: 'MI', t: 'R$ 55,40', a: 'BS' },
      { n: 'Sementes Santa Luzia', r: 'Soja · 6.400 sc', c: 'SJ', t: 'R$ 128,60', a: 'CM' },
    ],
  },
  {
    title: 'Em negociação',
    c: '#d6aa68',
    extra: 6,
    cards: [
      { n: 'Fazenda Primavera', r: 'Soja · 18.500 sc', c: 'SJ', t: 'contraproposta', a: 'AR' },
      { n: 'Agro Sorriso', r: 'Soja · 9.200 sc', c: 'SJ', t: 'hoje', a: 'DF' },
    ],
  },
  {
    title: 'Confirmada',
    c: '#345a77',
    extra: 3,
    cards: [
      { n: 'Cooperativa Vale Verde', r: 'Milho · 12.800 sc', c: 'MI', t: 'assinar', a: 'CM' },
      { n: 'Aviagro Alimentos', r: 'Milho · 42.000 sc', c: 'MI', t: 'venda', a: 'BS' },
    ],
  },
  {
    title: 'Contratada',
    c: '#1f6b33',
    extra: 2,
    cards: [{ n: 'Fazenda Três Rios', r: 'Soja · 15.000 sc', c: 'SJ', t: 'CT‑00512', a: 'AR' }],
  },
];

function KCard({ c, className = '', style, ai }: { c: KCardData; className?: string; style?: CSSProperties; ai?: boolean }) {
  return (
    <div className={`mk-kcard ${className}`} style={style}>
      <div className="mk-kcard__row">
        <span className="mk-kcard__name">{c.n}</span>
        <span className="mk-kcard__tag" style={{ background: COMMODITY[c.c] }}>
          {c.c}
        </span>
      </div>
      <div className="ui-muted" style={{ fontSize: 11.5 }}>
        {c.r}
      </div>
      {ai && <Ai>Margem 4,1% · 2 cenários prontos</Ai>}
      <div className="mk-kcard__row">
        <span className="ui-avatar" style={{ width: 20, height: 20, fontSize: 8.5 }}>
          {c.a}
        </span>
        <span className="ui-muted ui-mono" style={{ fontSize: 11 }}>
          {c.t}
        </span>
      </div>
    </div>
  );
}

/** A · direita — negociações em Kanban, inclinado; um cartão é arrastado a cada 3,5 s. */
export function TiltedKanban() {
  return (
    <div className="fl-tilt" style={{ position: 'absolute', inset: 0 }}>
      <div className="ui ui-card mk-board">
        {COLS.map((col, ci) => (
          <div key={col.title} style={{ position: 'relative' }}>
            <div className="mk-col__head" style={{ ['--c' as string]: col.c }}>
              <i style={{ width: 8, height: 8, borderRadius: 2, background: col.c }} />
              {col.title}
              <b>{col.cards.length + col.extra}</b>
            </div>
            {col.cards.map((c, k) => (
              <KCard key={c.n} c={c} style={ci === 0 && k === 0 ? { opacity: 0.35, borderStyle: 'dashed' } : undefined} />
            ))}
            {ci === 0 && (
              <>
                <KCard c={col.cards[0]} ai className="mk-drag" style={{ top: 44, left: 0 }} />
                <div className="mk-drag-cursor" style={{ position: 'absolute', top: 118, left: 150, zIndex: 6 }}>
                  <Cursor label="Ana · Comercial" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const DOCS = [
  {
    ch: 'Confirmação',
    icon: <FileText size={13} />,
    bg: '#0c3c33',
    title: 'CT‑2026‑00512 · Milho',
    body: 'Confirmação de negócio assinada pelas duas partes. Saldo de 30.000 sc aberto para entregas até novembro.',
    st: 'Anexada ao contrato',
  },
  {
    ch: 'Ticket de balança',
    icon: <Scale size={13} />,
    bg: '#b98a3c',
    title: 'Placa RVD‑4E21 · carga 3',
    body: 'Bruto 52.180 kg, tara 14.760 kg, líquido 37.420 kg. Entrada às 08:42 no pátio de Rio Verde.',
    st: 'Baixado do saldo',
  },
  {
    ch: 'Laudo',
    icon: <Flask size={13} />,
    bg: '#2f7a3e',
    title: 'Laudo 0412 · Milho tipo 1',
    body: 'Umidade 14,6%, impureza 0,8%, avariados 3,1%. Desconto de 1,2% pelo padrão do contrato.',
    st: 'Desconto lançado',
  },
];

/** B · esquerda — documentos que chegam e se ligam ao contrato. */
export function DocStack() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(2400, inView);
  const active = t % 3;
  const pos = [
    { left: 0, top: 10, r: -3 },
    { left: 50, top: 170, r: 2 },
    { left: 10, top: 330, r: -1.5 },
  ];
  return (
    <div ref={ref} className="mk-msgs ui">
      {DOCS.map((m, i) => (
        <div
          key={m.title}
          className="ui-card mk-msg"
          style={{
            left: pos[i].left,
            top: pos[i].top,
            transform: `rotate(${pos[i].r}deg) translateY(${active === i ? -6 : 0}px)`,
            transition: 'transform .5s cubic-bezier(.22,1,.36,1), box-shadow .5s',
            boxShadow: active === i ? '0 26px 60px rgba(47,122,62,.22)' : undefined,
            zIndex: active === i ? 3 : 1,
          }}
        >
          <div className="mk-msg__top">
            <span className="ui-tile" style={{ width: 22, height: 22, borderRadius: 3, background: m.bg, color: '#fff', boxShadow: 'none' }}>
              {m.icon}
            </span>
            {m.ch} · <span style={{ color: '#1d2422' }}>{m.title}</span>
          </div>
          <p>{m.body}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8 }}>
            <span className={`ui-chip ${active === i ? 'ui-chip--lime' : ''}`}>
              {active === i ? <Send size={11} /> : <CheckCircle size={11} />} {m.st}
            </span>
            <Ai>relacionado pela IA</Ai>
          </div>
        </div>
      ))}
    </div>
  );
}

const STANDARDS = [
  { name: 'Milho tipo 1', grain: '', lot: 'Carga 3 · CT‑2026‑00512', rows: [['Umidade', '14,6%', '14,0%'], ['Impureza', '0,8%', '1,0%'], ['Avariados', '3,1%', '6,0%'], ['Ardidos', '0,4%', '1,0%']], over: 0, desc: '1,2%' },
  { name: 'Milho tipo 2', grain: '', lot: 'Carga 3 · CT‑2026‑00512', rows: [['Umidade', '14,6%', '14,5%'], ['Impureza', '0,8%', '1,5%'], ['Avariados', '3,1%', '10,0%'], ['Ardidos', '0,4%', '2,0%']], over: 0, desc: '0,2%' },
  { name: 'Soja padrão exportação', grain: 'soja', lot: 'Carga 7 · CT‑2026‑00481', rows: [['Umidade', '13,2%', '14,0%'], ['Impureza', '1,4%', '1,0%'], ['Avariados', '5,2%', '8,0%'], ['Esverdeados', '2,1%', '8,0%']], over: 1, desc: '0,4%' },
  { name: 'Soja padrão interno', grain: 'soja', lot: 'Carga 7 · CT‑2026‑00481', rows: [['Umidade', '13,2%', '14,0%'], ['Impureza', '1,4%', '1,0%'], ['Avariados', '5,2%', '8,0%'], ['Esverdeados', '2,1%', '10,0%']], over: 1, desc: '0,4%' },
];

/** B · direita — laudo de recebimento com seletor do padrão de classificação. */
export function QualityReport() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(2600, inView);
  const m = t % STANDARDS.length;
  const s = STANDARDS[m];
  return (
    <div ref={ref} className="ui ui-card mk-page">
      <div className="mk-page__preview">
        <div className={`mk-grain ${s.grain === 'soja' ? 'mk-grain--soja' : ''} mk-lead__swap`} key={`g${m}`}>
          <span className="ui-chip" style={{ background: 'rgba(255,255,255,.92)' }}>
            {s.lot}
          </span>
        </div>
        <div className="mk-params mk-lead__swap" key={`p${m}`}>
          <div>
            <span>Parâmetro</span>
            <span>Medido</span>
            <span>Limite</span>
          </div>
          {s.rows.map(([k, v, l], i) => (
            <div key={k}>
              <span>{k}</span>
              <b className={`ui-mono ${i === s.over ? 'is-over' : ''}`} style={{ fontWeight: 600 }}>
                {v}
              </b>
              <span className="ui-mono ui-muted">{l}</span>
            </div>
          ))}
        </div>
        <div className="mk-params__total">
          <span>Desconto</span>
          <span className="ui-chip ui-chip--red ui-mono">{s.desc}</span>
        </div>
      </div>
      <div className="mk-page__side">
        <div style={{ fontWeight: 650 }}>Laudo de recebimento</div>
        <div className="mk-select">
          <div className="mk-select__head">
            Padrão de classificação <CaretDown size={12} />
          </div>
          {STANDARDS.map((x, i) => (
            <div key={x.name} className={`mk-select__opt ${i === m ? 'is-on' : ''}`}>
              {i === m ? <Check size={12} /> : <span style={{ width: 12 }} />} {x.name}
            </div>
          ))}
        </div>
        <div className="ui-muted" style={{ fontSize: 11 }}>
          Os limites vêm do padrão do contrato.
        </div>
      </div>
      <div className="mk-page__bar">
        <span className="ui-muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          → O desconto entra direto no contrato
        </span>
        <span className="ui-btn ui-btn--blue">Aprovar laudo</span>
      </div>
    </div>
  );
}

const PEOPLE = [
  { n: 'Marcos', i: 'MR', role: 'Gerente' },
  { n: 'Bruno', i: 'BS', role: 'Comercial' },
  { n: 'Carla', i: 'CM', role: 'Financeiro' },
  { n: 'Diego', i: 'DF', role: 'Diretoria' },
  { n: 'Elisa', i: 'EP', role: 'férias', off: true },
];

/** C · largo — regra de alçada + fila que para no aprovador certo. */
export function Approval() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const tick = useTicker(140, inView);
  const phase = tick % 64;
  const spinning = phase < 15;
  const hop = spinning ? (phase + 1) % 4 : 0;
  const chosen = !spinning;
  const showOk = phase >= 17;
  const showWait = phase >= 22;
  const left = 119 - Math.max(0, Math.floor((phase - 22) * 0.14));
  const [frozen, setFrozen] = useState(false);
  useEffect(() => setFrozen(!inView), [inView]);
  return (
    <div ref={ref} className="mk-dist ui">
      <div className="ui-card mk-rule">
        <div style={{ fontWeight: 650, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
          Regra de aprovação <span className="ui-switch" style={{ marginLeft: 'auto' }} />
        </div>
        {[
          ['Tipo', 'Desconto comercial'],
          ['Acima de', 'R$ 50 mil'],
          ['Ordem', 'Gerente → Diretoria'],
          ['Prazo', '2 h'],
        ].map(([k, v]) => (
          <div className="mk-rule__row" key={k}>
            <span className="ui-muted">{k}</span>
            <b style={{ fontWeight: 600 }}>{v}</b>
          </div>
        ))}
        <div className="ui-muted" style={{ fontSize: 11, marginTop: 10 }}>
          Se ninguém aprovar no prazo, sobe para o próximo nível.
        </div>
      </div>
      <div className="ui-card mk-roulette">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontWeight: 650 }}>Fila de aprovação</b>
          <span className="ui-chip ui-chip--blue">
            <Users size={11} /> Novo pedido · CT‑00512
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          <Ai>Liquidação preparada · memória de cálculo anexada</Ai>
        </div>
        <div className="mk-roulette__people">
          {PEOPLE.map((p, i) => (
            <div key={p.n} className={`mk-person ${p.off ? 'is-off' : ''} ${spinning && hop === i && !frozen ? 'is-hop' : ''} ${chosen && i === 0 ? 'is-chosen' : ''}`}>
              <span className="ui-avatar">{p.i}</span>
              {p.n}
              <span className="ui-muted" style={{ fontSize: 10 }}>
                {p.role}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mk-status">
        {showOk && (
          <span className="ui-chip is-ok mk-pop">
            <Check size={13} color="#9fe870" /> Enviado para Marcos (Gerente) em 2 s
          </span>
        )}
        {showWait && (
          <span className="ui-chip mk-pop">
            <Clock size={13} /> Aguardando aprovação… {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </span>
        )}
      </div>
    </div>
  );
}
