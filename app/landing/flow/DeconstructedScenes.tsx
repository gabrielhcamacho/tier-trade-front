'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useInView, useParallax, useTicker } from './hooks';
import { Ai, Cursor } from './parts';
import { Check, CheckCircle, Clock, FilePdf, FileText, Flask, LinkIcon, MapPin, Plus, Receipt, Scale, Search, Trophy, Truck, Warehouse } from './icons';

/*
 * Cenas "desconstruídas": as peças principais do produto flutuam em camadas num plano inclinado,
 * o mesmo recurso da cena do contrato. Dados todos fictícios.
 */
function Layer({ x, y, w, z, drift = 0, className = '', style, children }: { x: number; y: number; w?: number; z: number; drift?: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      className={`fl-layer ${className}`}
      style={{
        left: x,
        top: y + z * 0.3,
        width: w,
        transform: `translateZ(${z}px) translateY(calc(var(--p, 0) * ${-drift}px))`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ───────── 8 · Estoque por lote ───────── */
const LINKS: [ReactNode, string][] = [
  [<FileText size={14} key="c" />, 'Contrato CT‑00512'],
  [<Truck size={14} key="t" />, 'Carga 3'],
  [<Scale size={14} key="b" />, 'Ticket RVD‑4E21'],
  [<Flask size={14} key="l" />, 'Laudo 0412'],
  [<Receipt size={14} key="n" />, 'NF‑e 4.512'],
  [<Warehouse size={14} key="w" />, 'Silo 3 · Rio Verde'],
];
const ROWS = [
  { c: 'MI', code: 'LT‑0412', n: 'Milho · Armazém Rio Verde/GO', q: '18.400 sc', s: 'Disponível' },
  { c: 'SJ', code: 'LT‑0398', n: 'Soja · Armazém Sorriso/MT', q: '12.050 sc', s: 'Comprometido' },
  { c: 'MI', code: 'LT‑0391', n: 'Milho · Rondonópolis/MT', q: '9.800 sc', s: 'Disponível' },
  { c: 'SJ', code: 'LT‑0377', n: 'Soja · Cascavel/PR', q: '6.200 sc', s: 'Comprometido' },
];
const SWATCH: Record<string, string> = {
  MI: 'linear-gradient(135deg,#e6bf6e,#b9842f)',
  SJ: 'linear-gradient(135deg,#eadb9b,#bfa54f)',
};

export function LotsScene() {
  const wrap = useParallax<HTMLDivElement>();
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const t = useTicker(1000, inView);
  const step = t % 8; // 0–2 laudo chegando, 3–4 vinculando, 5+ rastreado
  const done = step >= 5;
  const linked = done ? 6 : step >= 3 ? (step - 2) * 2 : 0;
  return (
    <div ref={wrap} className="fl-scene3" aria-hidden="true">
      <div ref={ref} className="fl-scene3__plane fl-scene3__plane--dark">
        {/* base · lista de lotes */}
        <Layer x={190} y={40} w={620} z={0} className="ui mk-panel mk-base">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <b style={{ fontSize: 16, fontWeight: 650 }}>Estoque</b>
            <span className="ui-chip">32 lotes</span>
            <div className="ui-input ui-muted" style={{ marginLeft: 'auto', width: 220, gap: 6 }}>
              <Search size={13} /> Buscar lote ou contrato…
            </div>
          </div>
          <div className="mk-prop mk-prop--slot">
            <span className="mk-slot" />
            <div>
              <b style={{ fontWeight: 600 }}>LT‑0415 · Milho · Silo 3</b>
              <div className="ui-muted">Rio Verde/GO · carga 3 do CT‑00512</div>
            </div>
            <b className="ui-mono" style={{ fontWeight: 600 }}>
              37.420 kg
            </b>
            <span className={`ui-chip ${done ? 'ui-chip--green' : 'ui-chip--grain'}`}>
              {done ? <Check size={11} /> : <Clock size={11} />} {done ? 'Liberado' : 'Classificando'}
            </span>
          </div>
          {ROWS.map((r) => (
            <div key={r.code} className="mk-prop">
              <span className="mk-swatch" style={{ background: SWATCH[r.c] }}>
                {r.c}
              </span>
              <div>
                <b style={{ fontWeight: 600 }}>
                  {r.code} · {r.n.split(' · ')[0]}
                </b>
                <div className="ui-muted">{r.n.split(' · ')[1]}</div>
              </div>
              <b className="ui-mono" style={{ fontWeight: 600 }}>
                {r.q}
              </b>
              <span className={`ui-chip ${r.s === 'Disponível' ? 'ui-chip--green' : 'ui-chip--blue'}`}>{r.s}</span>
            </div>
          ))}
        </Layer>

        {/* vínculos (esquerda) */}
        <Layer x={-70} y={140} w={240} z={90} drift={30} className="ui mk-panel">
          <h5 style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <LinkIcon size={15} /> Rastro do lote
            </span>
            <Ai>IA</Ai>
          </h5>
          {LINKS.map(([ic, n], i) => (
            <div key={n} className="mk-cat">
              {ic}
              {n}
              <span className={`mk-dot ${i < linked ? 'is-on' : ''}`} />
            </div>
          ))}
        </Layer>

        {/* filtros */}
        <Layer x={150} y={540} z={110} drift={40} className="ui mk-chips">
          {['Milho', 'Soja', 'Disponível', 'Comprometido'].map((f, i) => (
            <span key={f} className={`ui-chip ${i < 2 ? 'ui-chip--blue' : ''}`}>
              {i < 2 && <Check size={11} />} {f}
            </span>
          ))}
        </Layer>

        {/* ficha do lote (protagonista) */}
        <Layer x={760} y={110} w={290} z={150} drift={60} className="ui mk-panel" style={{ padding: 12 }}>
          <div className="mk-cover mk-grain" style={{ position: 'relative' }}>
            <span className="ui-chip" style={{ background: 'rgba(255,255,255,.92)' }}>
              Milho tipo 1
            </span>
          </div>
          <div style={{ padding: '12px 4px 4px' }}>
            <b style={{ fontWeight: 650, fontSize: 14 }}>LT‑0415 · Milho</b>
            <div className="ui-muted" style={{ marginTop: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
              <MapPin size={12} /> Armazém Rio Verde/GO · silo 3
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', margin: '10px 0', color: '#3d4743' }}>
              <span className="mk-spec">Umidade <b className="ui-mono">13,1%</b></span>
              <span className="mk-spec">Impureza <b className="ui-mono">0,5%</b></span>
              <span className="mk-spec">Origem <b>Boa Vista</b></span>
              <span className="mk-spec">Contrato <b className="ui-mono">00512</b></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b className="ui-mono" style={{ fontWeight: 700, fontSize: 15 }}>
                623,7 sc
              </b>
              <span className={`ui-chip ${done ? 'ui-chip--green' : 'ui-chip--grain'}`}>
                {done ? <CheckCircle size={11} /> : <Clock size={11} />} {done ? 'Rastreado' : `Vinculando ${linked}/6`}
              </span>
            </div>
          </div>
        </Layer>

        {/* laudo sendo arrastado para a lista */}
        <Layer x={210} y={110} z={170}>
          <div className="mk-drag-photo">
            <div className="mk-file">
              <span className="ui-tile" style={{ width: 30, height: 30, background: '#c5442b', boxShadow: 'none' }}>
                <FilePdf size={16} />
              </span>
              laudo-LT-0415.pdf
            </div>
            <Cursor label="Camila · Qualidade" color="#b98a3c" style={{ left: 170, top: 30 }} />
          </div>
        </Layer>

        {/* novo lote */}
        <Layer x={660} y={10} z={100} drift={20}>
          <span className="ui-btn ui-btn--blue" style={{ height: 36, padding: '0 16px', boxShadow: '0 16px 30px rgba(159,232,112,.35)' }}>
            <Plus size={13} /> Novo lote
          </span>
        </Layer>
      </div>
    </div>
  );
}

/* ───────── 10 · Central da diretoria ───────── */
function Meta({ label, value, goal, pct, color }: { label: string; value: string; goal: string; pct: number; color: string }) {
  return (
    <>
      <span className="ui-muted">{label}</span>
      <strong className="ui-mono">
        {value} <small>{goal}</small>
      </strong>
      <div className="mk-progress">
        <i style={{ width: `${pct}%`, background: color }} />
      </div>
    </>
  );
}

export function KpiScene({ lit }: { lit: number }) {
  const wrap = useParallax<HTMLDivElement>();
  const hl = (i: number) => `mk-hl ${lit > i ? 'is-on' : ''}`;
  return (
    <div ref={wrap} className="fl-scene3" aria-hidden="true">
      <div className="fl-scene3__plane fl-scene3__plane--light">
        {/* base · painel com os encaixes vazios de onde os cartões "saíram" */}
        <Layer x={40} y={20} w={780} z={0} className="ui mk-panel mk-base">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <b style={{ fontSize: 16, fontWeight: 650 }}>Central · Visão geral</b>
            <span className="ui-chip">Safra 2025/26</span>
            <span className="ui-chip">Milho e soja</span>
          </div>
          <div className="mk-slots">
            <i />
            <i />
            <i />
            <i />
            <i style={{ gridColumn: 'span 2', height: 186 }} />
            <i style={{ gridColumn: 'span 2', height: 186 }} />
          </div>
          <div className="mk-meta" style={{ marginTop: 14 }}>
            <span className="ui-muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <Trophy size={13} /> Maiores compradores do mês
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 10 }}>
              {[
                ['AV', 'Aviagro Alimentos', '42.000 sc'],
                ['CV', 'Coop. Vale Verde', '28.300 sc'],
                ['AS', 'Agro Sorriso', '18.500 sc'],
                ['FP', 'Faz. Primavera', '12.800 sc'],
              ].map(([i, n, v], k) => (
                <div key={n} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="ui-avatar" style={k === 0 ? { background: '#9fe870' } : undefined}>
                    {i}
                  </span>
                  <span>
                    <b style={{ fontWeight: 600, display: 'block' }}>{n}</b>
                    <span className="ui-muted ui-mono">{v}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Layer>

        <Layer x={58} y={90} w={177} z={50} drift={15} className="ui mk-meta mk-float-card">
          <Meta label="Contratado (mil sc)" value="412" goal="de 400" pct={100} color="#2f7a3e" />
        </Layer>
        <Layer x={247} y={90} w={177} z={130} drift={40} className={`ui mk-meta mk-float-card ${hl(0)}`}>
          <Meta label="Cargas recebidas" value="18" goal="de 200" pct={9} color="#c5442b" />
          <span className="mk-hl__tag" style={{ top: -20, left: 12 }}>
            Recebimento em 9% do previsto
          </span>
        </Layer>
        <Layer x={436} y={90} w={177} z={70} drift={20} className="ui mk-meta mk-float-card">
          <Meta label="Margem média" value="5,2%" goal="meta 6%" pct={87} color="#2f7a3e" />
        </Layer>
        <Layer x={625} y={90} w={177} z={90} drift={25} className="ui mk-meta mk-float-card">
          <Meta label="Liquidado" value="70%" goal="do previsto" pct={70} color="#2f7a3e" />
        </Layer>

        <Layer x={58} y={196} w={366} z={110} drift={35} className={`ui mk-meta mk-float-card ${hl(1)}`}>
          <span className="ui-muted">Exposição sem cobertura</span>
          <strong className="ui-mono">54 mil sc</strong>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, marginTop: 12 }}>
            {[30, 42, 38, 55, 61, 48, 70, 66, 82, 90, 76, 95].map((h, k) => (
              <i key={k} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: k > 8 ? 'rgba(197,68,43,.6)' : '#e1e6e0' }} />
            ))}
          </div>
          <span className="mk-hl__tag" style={{ top: 12, right: 12 }}>
            Exposição subindo
          </span>
        </Layer>

        <Layer x={436} y={196} w={366} z={170} drift={60} className={`ui mk-meta mk-float-card ${hl(2)}`}>
          <span className="ui-muted">Conversão por etapa</span>
          <div style={{ marginTop: 10 }}>
            {(
              [
                ['Oferta → Negociação', 68],
                ['Negociação → Contrato', 18],
                ['Contrato → Entrega', 41],
                ['Entrega → Liquidação', 55],
              ] as [string, number][]
            ).map(([l, v]) => (
              <div key={l} className="mk-reason">
                <div>
                  <span>{l}</span>
                  <b className="ui-mono" style={{ fontWeight: 600, color: v === 18 ? '#c5442b' : undefined }}>
                    {v}%
                  </b>
                </div>
                <i style={{ width: `${v}%`, background: v === 18 ? '#c5442b' : '#2f7a3e' }} />
              </div>
            ))}
          </div>
          <span className="mk-hl__tag" style={{ bottom: -16, left: 16 }}>
            ✦ Só 18% viram contrato: 2 traders somam 70% das perdas
          </span>
        </Layer>

        <Layer x={850} y={150} w={230} z={140} drift={30} className={`ui mk-meta mk-float-card ${hl(3)}`}>
          <span className="ui-muted">Motivos de desconto</span>
          <div style={{ marginTop: 10 }}>
            {(
              [
                ['Umidade', 46],
                ['Impureza', 22],
                ['Avariados', 17],
                ['Quebra de peso', 9],
              ] as [string, number][]
            ).map(([l, v]) => (
              <div key={l} className="mk-reason">
                <div>
                  <span>{l}</span>
                  <b className="ui-mono" style={{ fontWeight: 600 }}>
                    {v}%
                  </b>
                </div>
                <i style={{ width: `${v * 2}%` }} />
              </div>
            ))}
          </div>
          <span className="mk-hl__tag" style={{ top: -18, right: 12 }}>
            Umidade é o 1º motivo
          </span>
        </Layer>
        <Layer x={720} y={330} z={190} drift={55}>
          <Cursor label="Rafael · Diretoria" />
        </Layer>
      </div>
    </div>
  );
}
