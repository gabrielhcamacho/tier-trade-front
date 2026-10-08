'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HeroVideo } from '../hero-video';
import { prefersReducedMotion, useReveal } from './hooks';
import { Logo, LOGO, ScaleBox, scrollToSection } from './parts';
import { Approval, DocStack, OfferArriving, QualityReport, TiltedKanban } from './BentoMockups';
import { ConnectPanel, ContractScene, FanCards, ImportLines, RolesSelector } from './ProductMockups';
import { KpiScene, LotsScene } from './DeconstructedScenes';
import {
  ArrowRight,
  Bank,
  Bell,
  Calculator,
  ChartUp,
  Chat,
  Check,
  Clipboard,
  Close,
  Coin,
  Envelope,
  FilePdf,
  FileSheet,
  FileText,
  Flask,
  Handshake,
  LinkIcon,
  Lock,
  MapPin,
  Menu,
  Receipt,
  Route,
  Scale,
  Search,
  Shield,
  Sparkle,
  Target,
  Timer,
  Truck,
  UserGear,
  Users,
  Warehouse,
  Warning,
} from './icons';
import './flow.css';

export const DEMO = 'mailto:contato@tiertrade.com.br?subject=Demonstra%C3%A7%C3%A3o%20Tier%20Trade';

const NAV: { label: string; id: string }[] = [
  { label: 'Plataforma', id: 'plataforma' },
  { label: 'Operação', id: 'operacao' },
  { label: 'IA', id: 'ia' },
  { label: 'Gestão', id: 'gestao' },
];

function NavLink({ item, onClick }: { item: (typeof NAV)[number]; onClick?: () => void }) {
  return (
    <a
      href={`#${item.id}`}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        scrollToSection(item.id);
      }}
    >
      {item.label}
    </a>
  );
}

/* ───────────────────── Header ───────────────────── */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      setScrolled(scrollY > 8);
      const sections = document.querySelectorAll<HTMLElement>('.fl [data-theme]');
      let t: 'light' | 'dark' = 'light';
      sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= 32 && r.bottom > 32) t = s.dataset.theme as 'light' | 'dark';
      });
      setTheme(t);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className="fl-header" data-scrolled={scrolled || open} data-theme={theme}>
      <div className="fl-container fl-header__inner">
        <a href="#conteudo" aria-label="Tier Trade, início" onClick={(e) => (e.preventDefault(), scrollTo({ top: 0, behavior: 'smooth' }))}>
          <Logo tone={theme === 'dark' ? 'light' : 'dark'} />
        </a>
        <nav aria-label="Principal">
          {NAV.map((n) => (
            <NavLink key={n.id} item={n} />
          ))}
        </nav>
        <div className="fl-header__end">
          <a className="fl-btn fl-btn--login fl-btn--sm" href="/login">
            Entrar
          </a>
          <a className="fl-btn fl-btn--primary fl-btn--sm" href={DEMO}>
            Agende uma demonstração <ArrowRight size={14} />
          </a>
          <button className="fl-header__menu" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <Close size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="fl-mobile-nav">
          {NAV.map((n) => (
            <NavLink key={n.id} item={n} onClick={() => setOpen(false)} />
          ))}
          <a href="/login" onClick={() => setOpen(false)}>
            Entrar
          </a>
          <a className="fl-btn fl-btn--primary" style={{ marginTop: 8, justifyContent: 'center' }} href={DEMO} onClick={() => setOpen(false)}>
            Agende uma demonstração <ArrowRight size={14} />
          </a>
        </div>
      )}
    </header>
  );
}

function DemoButton({ label = 'Agende uma demonstração' }: { label?: string }) {
  return (
    <a className="fl-btn fl-btn--primary" href={DEMO}>
      <span className="fl-glow" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      {label} <ArrowRight size={16} />
    </a>
  );
}

/* Título com entrada palavra a palavra */
function Words({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="fl-word" style={{ ['--i' as string]: start + i }}>
          {w}&nbsp;
        </span>
      ))}
    </>
  );
}

/* ───────────────────── 1 · Hero ───────────────────── */
const STAGES: { name: string; icon: ReactNode }[] = [
  { name: 'Oferta', icon: <Coin size={22} /> },
  { name: 'Negociação', icon: <Handshake size={22} /> },
  { name: 'Contrato', icon: <FileText size={22} /> },
  { name: 'Agenda de cargas', icon: <Truck size={22} /> },
  { name: 'Pátio', icon: <MapPin size={22} /> },
  { name: 'Balança', icon: <Scale size={22} /> },
  { name: 'Laudo', icon: <Flask size={22} /> },
  { name: 'Estoque', icon: <Warehouse size={22} /> },
  { name: 'NF‑e', icon: <Receipt size={22} /> },
  { name: 'Liquidação', icon: <Bank size={22} /> },
  { name: 'Conciliação', icon: <LinkIcon size={22} /> },
];

function Hero() {
  const set = (
    <div className="fl-marquee__set">
      {STAGES.map((m) => (
        <span key={m.name} className="fl-brand">
          {m.icon}
          {m.name}
        </span>
      ))}
    </div>
  );
  return (
    <section className="fl-hero" data-theme="dark">
      <HeroVideo className="fl-hero__video" />
      <div className="fl-hero__content">
        <h1 className="fl-h1">
          <Words text="Toda a operação de grãos, da oferta ao caixa" />
        </h1>
        <p className="fl-lead fl-in" style={{ ['--delay' as string]: '650ms' }}>
          Ofertas, contratos, cargas, qualidade, estoque e liquidação num só sistema, com IA fazendo o trabalho de escritório. Sua equipe fica com as decisões.
        </p>
        <div className="fl-hero__ctas fl-in" style={{ ['--delay' as string]: '800ms' }}>
          <DemoButton />
          <button className="fl-btn fl-btn--ghost" onClick={() => scrollToSection('plataforma')}>
            Ver a plataforma <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <div className="fl-logos fl-in" style={{ ['--delay' as string]: '1000ms' }}>
        <div className="fl-container fl-logos__inner">
          <div className="fl-logos__label">Uma operação inteira, num só lugar</div>
          <div className="fl-marquee">
            <div className="fl-marquee__track">
              {set}
              <div aria-hidden="true">{set}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── 3 · Bento ───────────────────── */
function CellTitle({ size, strong, rest, before }: { size: 'h3' | 'h4'; strong: string; rest: string; before: string }) {
  const Tag = size === 'h3' ? 'h3' : 'h4';
  return (
    <Tag className={size === 'h3' ? 'fl-h3' : 'fl-h4'} data-reveal>
      <span className="fl-dim">{before} </span>
      {strong}
      <span className="fl-dim">{rest}</span>
    </Tag>
  );
}

function Bento() {
  return (
    <section className="fl-bento-wrap" data-theme="light" id="plataforma">
      <div className="fl-container fl-bento">
        <div className="fl-row">
          <div className="fl-cell">
            <CellTitle size="h4" before="Receba" strong="ofertas de todos os canais" rest=", sem digitar nada" />
            <div className="fl-cell__stage">
              <OfferArriving />
            </div>
          </div>
          <div className="fl-cell">
            <CellTitle size="h3" before="Negocie" strong="mais rápido" rest=", com a margem à vista" />
            <div className="fl-cell__stage">
              <TiltedKanban />
            </div>
          </div>
        </div>
        <div className="fl-row">
          <div className="fl-cell">
            <CellTitle size="h4" before="Cada" strong="documento" rest=" no contrato certo" />
            <div className="fl-cell__stage">
              <DocStack />
            </div>
          </div>
          <div className="fl-cell">
            <CellTitle size="h3" before="Classifique com" strong="o seu padrão" rest=", e o desconto já sai calculado" />
            <div className="fl-cell__stage">
              <QualityReport />
            </div>
          </div>
        </div>
        <div className="fl-row fl-row--c">
          <div className="fl-cell">
            <CellTitle size="h4" before="Aprove descontos e liquidações" strong="por alçada" rest=", sem travar o time" />
            <div className="fl-cell__stage">
              <Approval />
            </div>
          </div>
          <div className="fl-cell" aria-hidden="true">
            <div className="fl-cell__glow" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── 4 · Manifesto ───────────────────── */
function Manifesto() {
  return (
    <section className="fl-manifesto" data-theme="dark">
      {/* o topo da seção ainda é claro: o header só vira escuro quando o verde aparece */}
      <div className="fl-standard__probe" data-theme="light" aria-hidden="true" style={{ height: 360 }} />
      <div className="fl-container">
        <p className="fl-manifesto__label" data-reveal>
          Que operação a sua trading entrega quando nenhuma carga fica sem dono?
        </p>
        <div className="fl-manifesto__grid">
          <h3 className="fl-h3" data-reveal>
            Sua operação merece mais que planilha paralela e retrabalho
          </h3>
          <p data-reveal style={{ ['--d' as string]: 1 }}>
            Uma oferta vira contrato, o contrato vira cargas, cada carga passa pela balança e pelo laudo, e tudo isso precisa chegar certo ao financeiro. Quando cada etapa
            vive numa planilha diferente, a margem só aparece no fim do mês. Com o Tier Trade, cada saca carrega a sua origem, o seu contrato e o seu custo do início ao
            caixa, e a IA cuida da papelada entre uma etapa e outra. <b>É hora de operar a safra inteira com a precisão de uma carga só.</b>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── 5–8 · Bloco escuro ───────────────────── */
const SOURCES: { n: string; el: ReactNode }[] = [
  { n: 'Planilhas', el: <FileSheet size={22} /> },
  { n: 'NF‑e', el: <Receipt size={22} /> },
  { n: 'CT‑e e MDF‑e', el: <Route size={22} /> },
  { n: 'Balança', el: <Scale size={22} /> },
  { n: 'Laudos', el: <Flask size={22} /> },
  { n: 'Extratos', el: <Bank size={22} /> },
  { n: 'PDFs', el: <FilePdf size={22} /> },
  { n: 'E-mail', el: <Envelope size={22} /> },
  { n: 'Mensagens', el: <Chat size={22} /> },
  { n: 'Relatórios', el: <ChartUp size={22} /> },
];

function Feat({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="fl-feat">
      {icon}
      {children}
    </span>
  );
}

function DarkBlock() {
  return (
    <div className="fl-dark fl-grain" data-theme="dark" id="operacao">
      {/* 5 · nova forma */}
      <section className="fl-section" style={{ paddingBottom: 40 }}>
        <div className="fl-container">
          <div className="fl-center">
            <h2 className="fl-h2" data-reveal>
              Uma nova forma de operar a sua trading
            </h2>
            <p className="fl-body" data-reveal style={{ ['--d' as string]: 1 }}>
              O Tier Trade junta comercial, contratos, logística, qualidade, estoque e financeiro num sistema só, simples de configurar e rápido de usar. Sem planilhas
              paralelas e sem etapas espalhadas.
            </p>
            <div className="fl-integrations" data-reveal style={{ ['--d' as string]: 2 }}>
              {SOURCES.map((i) => (
                <div key={i.n} className="fl-integration">
                  <span>{i.el}</span>
                  {i.n}
                </div>
              ))}
            </div>
          </div>
          <ContractScene />
          <p className="fl-caption" style={{ textAlign: 'center', marginTop: -40 }} data-reveal>
            <b>Cada contrato mostra onde a carga está e o que falta.</b> A IA prepara o próximo passo e você confirma.{' '}
            <a href="#ia" onClick={(e) => (e.preventDefault(), scrollToSection('ia'))} style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Saiba mais
            </a>
          </p>
        </div>
      </section>

      {/* 6 · duas colunas */}
      <section className="fl-section" style={{ paddingTop: 100 }}>
        <div className="fl-container fl-split">
          <div>
            <h3 className="fl-h3" data-reveal>
              Comece em minutos
            </h3>
            <p className="fl-body" data-reveal style={{ ['--d' as string]: 1 }}>
              Importe a planilha de contratos e saldos que você já tem e a equipe começa a usar no mesmo dia. A IA mapeia as colunas do sistema antigo e aponta
              inconsistências antes da importação.
            </p>
            <div className="fl-feats" data-reveal style={{ ['--d' as string]: 2 }}>
              <Feat icon={<FileSheet size={16} />}>Importa Excel e CSV</Feat>
              <Feat icon={<Timer size={16} />}>Configuração guiada</Feat>
            </div>
            <ImportLines />
          </div>
          <div>
            <h3 className="fl-h3" data-reveal>
              Uma visão para cada função
            </h3>
            <p className="fl-body" data-reveal style={{ ['--d' as string]: 1 }}>
              Comercial, logística, qualidade, financeiro e diretoria no mesmo sistema. Cada um vê o que precisa e aprova só o que está na sua alçada.
            </p>
            <div className="fl-feats" data-reveal style={{ ['--d' as string]: 2 }}>
              <Feat icon={<UserGear size={16} />}>Perfis prontos</Feat>
              <Feat icon={<Lock size={16} />}>Alçadas por valor</Feat>
            </div>
            <RolesSelector />
          </div>
        </div>
      </section>

      {/* 7 · conciliação */}
      <section className="fl-section" style={{ paddingTop: 40 }}>
        <div className="fl-container fl-tools">
          <div>
            <h3 className="fl-h3" data-reveal>
              Recebe o que a operação já produz
            </h3>
            <p className="fl-body" data-reveal style={{ ['--d' as string]: 1, marginTop: 24 }}>
              Extratos, tickets de balança, laudos, planilhas e XML de NF‑e, CT‑e e MDF‑e entram no registro certo, sem redigitação. A IA liga contrato, carga, nota, título e
              pagamento e mostra só o que não bateu.
            </p>
            <div className="fl-feats" data-reveal style={{ ['--d' as string]: 2 }}>
              <Feat icon={<LinkIcon size={16} />}>Conciliação automática</Feat>
              <Feat icon={<Warning size={16} />}>Divergência com evidência</Feat>
            </div>
          </div>
          <ConnectPanel />
        </div>
      </section>

      {/* 8 · estoque */}
      <section className="fl-section" style={{ paddingTop: 60 }}>
        <div className="fl-container">
          <div className="fl-center">
            <h2 className="fl-h2" data-reveal>
              Cada saca no seu lote, com origem e dono
            </h2>
          </div>
          <div className="fl-feats3">
            <p data-reveal>
              <Clipboard size={18} color="#fbfcf8" />
              <span>
                <b>Lote rastreado.</b> Contrato, carga, ticket, laudo e nota ligados ao mesmo saldo.
              </span>
            </p>
            <p data-reveal style={{ ['--d' as string]: 1 }}>
              <Target size={18} color="#fbfcf8" />
              <span>
                <b>Saldo comprometido.</b> O que já está vendido aparece separado do que está disponível.
              </span>
            </p>
            <p data-reveal style={{ ['--d' as string]: 2 }}>
              <Search size={18} color="#fbfcf8" />
              <span>
                <b>Busca e filtros.</b> Milho, soja, armazém ou contrato, encontrados em segundos.
              </span>
            </p>
          </div>
          <div data-reveal>
            <ScaleBox width={1180} minScale={0.5}>
              <LotsScene />
            </ScaleBox>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────────────────── 9 · IA / números auditáveis ───────────────────── */
function Standard() {
  return (
    <section className="fl-standard fl-grain" data-theme="light" id="ia">
      {/* o começo da seção ainda é escuro: o header segue no tema escuro até a cor clarear */}
      <div className="fl-standard__probe" data-theme="dark" aria-hidden="true" />
      <div className="fl-container fl-split">
        <div>
          <div className="fl-gem" data-reveal>
            <Sparkle size={28} />
          </div>
          <h3 className="fl-h3" data-reveal>
            Uma equipe operacional digital
          </h3>
          <p className="fl-body" data-reveal style={{ ['--d' as string]: 1 }}>
            A IA lê documentos, relaciona registros e prepara contratos, liquidações e lançamentos. Sua equipe fica com as negociações, aprovações e exceções.
          </p>
        </div>
        <div>
          <div className="fl-gem fl-gem--cyan" data-reveal>
            <Calculator size={28} />
          </div>
          <h3 className="fl-h3" data-reveal>
            Números que a IA não inventa
          </h3>
          <p className="fl-body" data-reveal style={{ ['--d' as string]: 1 }}>
            Preço, margem, estoque, impostos e comissões saem de motores auditáveis, com memória de cálculo. Operações materiais passam pelas alçadas, e tudo fica
            registrado.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── 10 · Gestão + KPIs ───────────────────── */
function Management() {
  const kpi = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setLit(4);
      return;
    }
    const el = kpi.current;
    if (!el) return;
    let raf = 0;
    // mesmo intervalo do Rehut: começa com o topo a 75% da tela, termina com a base a 60%
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = innerHeight;
      const p = Math.max(0, Math.min(1, (0.75 * vh - r.top) / (0.15 * vh + r.height)));
      setLit(Math.min(4, Math.floor(p * 5 + 0.2)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <section className="fl-section" data-theme="light" style={{ paddingTop: 60 }} id="gestao">
      <div className="fl-container">
        <div className="fl-mgmt__top">
          <div>
            <h2 className="fl-h2" data-reveal>
              Sua diretoria sempre por dentro
            </h2>
            <p className="fl-body" data-reveal style={{ ['--d' as string]: 1 }}>
              Veja onde está cada carga, qual posição está sem cobertura e quanto vai entrar no caixa, sem pedir relatório para ninguém. A IA explica o que mudou e por quê.
            </p>
          </div>
          <div data-reveal style={{ ['--d' as string]: 2 }}>
            <FanCards />
          </div>
        </div>
        <div className="fl-feats4">
          <p data-reveal>
            <ChartUp size={18} color="#2f7a3e" />
            <span>
              <b>Acompanha</b> volume contratado, recebido e liquidado por safra.
            </span>
          </p>
          <p data-reveal style={{ ['--d' as string]: 1 }}>
            <Shield size={18} color="#2f7a3e" />
            <span>
              <b>Mostra</b> a exposição sem cobertura por commodity.
            </span>
          </p>
          <p data-reveal style={{ ['--d' as string]: 2 }}>
            <Bell size={18} color="#2f7a3e" />
            <span>
              <b>Alerta</b> quando uma carga, um título ou uma aprovação fica parado.
            </span>
          </p>
          <p data-reveal style={{ ['--d' as string]: 3 }}>
            <Clipboard size={18} color="#2f7a3e" />
            <span>
              <b>Registra</b> o histórico de cada contrato, da oferta à liquidação.
            </span>
          </p>
        </div>
        <div ref={kpi} data-reveal>
          <ScaleBox width={1180} minScale={0.5}>
            <KpiScene lit={lit} />
          </ScaleBox>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── 11 · CTA final ───────────────────── */
type FlowKind = 'comercial' | 'operacao' | 'financeiro' | 'gestao';
type Flow = { t: string; sub: string; icon: ReactNode; bg: string; color?: string; kind: FlowKind };
const KIND_LABEL: Record<FlowKind, string> = { comercial: 'Comercial', operacao: 'Operação', financeiro: 'Financeiro', gestao: 'Gestão' };

const ROW1: Flow[] = [
  { t: 'Oferta recebida', sub: 'Lida pela IA, preço e margem na hora', icon: <Sparkle size={18} />, bg: '#d6aa68', kind: 'comercial' },
  { t: 'Negociação', sub: 'Contraproposta registrada', icon: <Handshake size={18} />, bg: '#2f7a3e', kind: 'comercial' },
  { t: 'Confirmação', sub: 'Assinada pelas duas partes', icon: <Check size={18} />, bg: '#9fe870', color: '#062f28', kind: 'comercial' },
  { t: 'Contrato', sub: 'Saldo e obrigações extraídas', icon: <FileText size={18} />, bg: '#0c3c33', color: '#9fe870', kind: 'comercial' },
  { t: 'Liquidação', sub: 'Preparada e aprovada por alçada', icon: <Bank size={18} />, bg: '#345a77', kind: 'financeiro' },
  { t: 'Conciliação', sub: 'Extrato, título e nota ligados', icon: <LinkIcon size={18} />, bg: '#345a77', kind: 'financeiro' },
  { t: 'Exposição', sub: 'Cobertura por commodity', icon: <Shield size={18} />, bg: '#04110d', color: '#9fe870', kind: 'gestao' },
];
const ROW2: Flow[] = [
  { t: 'Agenda de cargas', sub: 'Janela por transportadora', icon: <Truck size={18} />, bg: '#b98a3c', kind: 'operacao' },
  { t: 'Pesagem', sub: 'Bruto, tara e líquido', icon: <Scale size={18} />, bg: '#b98a3c', kind: 'operacao' },
  { t: 'Laudo', sub: 'Desconto pelo seu padrão', icon: <Flask size={18} />, bg: '#2f7a3e', kind: 'operacao' },
  { t: 'Lote', sub: 'Origem, contrato e dono', icon: <Warehouse size={18} />, bg: '#0c3c33', color: '#9fe870', kind: 'operacao' },
  { t: 'NF‑e', sub: 'Entrada fiscal validada', icon: <Receipt size={18} />, bg: '#345a77', kind: 'financeiro' },
  { t: 'Comissão', sub: 'Corretor e contrato', icon: <Users size={18} />, bg: '#345a77', kind: 'financeiro' },
  { t: 'Relatório da safra', sub: 'Pronto para a diretoria', icon: <ChartUp size={18} />, bg: '#04110d', color: '#9fe870', kind: 'gestao' },
];

function FlowRow({ items, dur, reverse }: { items: Flow[]; dur: string; reverse?: boolean }) {
  const set = (
    <div className="fl-marquee__set">
      {items.map((f) => (
        <div key={f.t} className="fl-flow">
          <span className="fl-flow__tile" style={{ background: f.bg, color: f.color ?? '#fff', boxShadow: 'none' }}>
            {f.icon}
          </span>
          <div className="fl-flow__text">
            <span className={`fl-flow__kind fl-flow__kind--${f.kind}`}>{KIND_LABEL[f.kind]}</span>
            <h5>{f.t}</h5>
            <p>{f.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="fl-marquee" aria-hidden="true">
      <div className="fl-marquee__track" style={{ ['--dur' as string]: dur, animationDirection: reverse ? 'reverse' : undefined }}>
        {set}
        {set}
      </div>
    </div>
  );
}

function FinalCta() {
  return (
    <section className="fl-final" data-theme="light" id="contato">
      <div className="fl-final__glow" />
      <div className="fl-container fl-center">
        <h2 className="fl-h2" data-reveal>
          Opere mais safra sem aumentar a equipe
        </h2>
        <p className="fl-lead" data-reveal style={{ ['--d' as string]: 1 }}>
          Coloque o Tier Trade para trabalhar e feche cada contrato com a margem que você planejou.
        </p>
        <div className="fl-hero__ctas" data-reveal style={{ ['--d' as string]: 2 }}>
          <DemoButton />
          <a className="fl-btn fl-btn--ghost" href="/login">
            Entrar
          </a>
        </div>
      </div>
      <div className="fl-flows">
        <FlowRow items={ROW1} dur="70s" />
        <FlowRow items={ROW2} dur="80s" reverse />
      </div>
    </section>
  );
}

/* ───────────────────── 12 · Footer ───────────────────── */
function Footer() {
  return (
    <footer className="fl-footer" data-theme="light">
      <div className="fl-footer__glow" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="fl-container">
        <div className="fl-footer__cols">
          <div>
            <h6>Produto</h6>
            <ul>
              {NAV.map((n) => (
                <li key={n.id}>
                  <NavLink item={n} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6>Empresa</h6>
            <ul>
              <li>
                <a href="/login">Entrar</a>
              </li>
              <li>
                <a href={DEMO}>Agende uma demonstração</a>
              </li>
            </ul>
          </div>
          <div>
            <h6>Para quem</h6>
            <ul>
              <li>
                <span style={{ font: '500 17px/1.3 var(--sans)' }}>Tradings de grãos</span>
              </li>
              <li>
                <span style={{ font: '500 17px/1.3 var(--sans)' }}>Milho e soja</span>
              </li>
            </ul>
          </div>
          <div>
            <h6>Contato</h6>
            <ul>
              <li>
                <a href={DEMO}>contato@tiertrade.com.br</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="fl-footer__mark" aria-label="Tier Trade">
        <img src={LOGO.onLight} alt="" />
      </div>
      <div className="fl-container fl-footer__bottom">
        <span>© 2026 Tier Trade</span>
        <span>Feito para tradings de grãos</span>
      </div>
    </footer>
  );
}

/* ───────────────────── Página ───────────────────── */
export function FlowLanding() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  return (
    <div className="fl" ref={root}>
      <a className="flow-skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <div className="fl-seam" data-theme="dark" aria-hidden="true" />
        <Bento />
        <Manifesto />
        <DarkBlock />
        <Standard />
        <Management />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
