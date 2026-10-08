import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '../brand-logo';
import { HeroVideo } from './hero-video';
import { LandingMotion } from './motion';
import { ContractScene, IntakeScene, LoadScene, ManagementScene, OfferScene, PortfolioScene, RiskScene, RolesScene, StockScene, TraceScene, WorkflowScene } from './product-scenes';
import s from './landing.module.css';

export const metadata: Metadata = {
  title: 'Tier Trade | A trading inteira no mesmo fluxo',
  description: 'Comercial, contratos, execução física, estoque, risco e financeiro em uma plataforma para trading agrícola.',
};

const modules = ['Comercial', 'Contratos', 'Operações', 'Estoque', 'Risco', 'Financeiro'];

function Cta({ small = false }: { small?: boolean }) {
  return <a className={`${s.ctaButton} ${small ? s.ctaSmall : ''}`} href="mailto:contato@tiertrade.com.br?subject=Demonstra%C3%A7%C3%A3o%20Tier%20Trade"><span>Solicitar demonstração</span><span aria-hidden="true">↗</span></a>;
}
function Feature({ children }: { children: React.ReactNode }) { return <p className={s.feature}><span aria-hidden="true">↗</span>{children}</p>; }

export default function LandingPage() {
  return <div className={s.page}>
    <LandingMotion />
    <a className={s.skip} href="#conteudo">Ir para o conteúdo</a>
    <header className={s.header} data-header>
      <div className={s.container}><Link className={s.logo} href="/" aria-label="Tier Trade, início"><span className={s.logoOnLight}><BrandLogo variant="dark" /></span><span className={s.logoOnDark}><BrandLogo variant="light" /></span></Link>
        <nav aria-label="Navegação principal"><a href="#plataforma">Plataforma</a><a href="#operacao">Operação</a><a href="#gestao">Gestão</a></nav>
        <div className={s.headerActions}><Link href="/login">Entrar</Link><Cta small /></div>
      </div>
    </header>

    <main id="conteudo">
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s.heroBackdrop} aria-hidden="true"><div className={s.heroGrid} /><div className={s.heroOrb} /></div>
        <HeroVideo className={s.heroVideo} />
        <div className={s.heroVeil} />
        <div className={s.heroContent}><h1 id="hero-title"><span>Feito para tradings,</span><br /><span>pensado para quem</span><br /><span>move o agro.</span></h1><p>Da negociação ao caixa, o Tier Trade reúne pessoas, decisões e execução física em um fluxo que acompanha a operação de verdade.</p><div className={s.heroActions}><Cta /><a href="#plataforma" className={s.ghostButton}>Conhecer a plataforma <span aria-hidden="true">↘</span></a></div></div>
        <div className={s.heroBottom}><div className={s.container}><span>Uma plataforma. A operação inteira.</span><div className={s.marquee} aria-label="Áreas do Tier Trade"><div>{[...modules, ...modules].map((name, i) => <span key={i}>{name}</span>)}</div></div></div></div>
      </section>

      <section className={s.bento} id="plataforma" aria-label="O que o Tier Trade conecta"><div className={s.container}>
        <div className={s.bentoRow}><article className={s.bentoCell}><h2 data-reveal><span>Negocie com</span> margem à vista<span>, antes de assumir o compromisso</span></h2><div className={s.bentoVisual}><OfferScene /></div></article><article className={s.bentoCell}><h2 data-reveal><span>Transforme a decisão em</span> contrato<span>, sem recomeçar do zero</span></h2><div className={s.bentoVisual}><ContractScene /></div></article></div>
        <div className={s.bentoRow}><article className={s.bentoCell}><h2 data-reveal><span>Programe cargas e acompanhe a</span> execução física<span> em tempo real</span></h2><div className={s.bentoVisual}><LoadScene /></div></article><article className={s.bentoCell}><h2 data-reveal><span>Saiba onde está cada volume, com</span> estoque rastreável</h2><div className={s.bentoVisual}><StockScene /></div></article></div>
        <div className={`${s.bentoRow} ${s.bentoLast}`}><article className={s.bentoCell}><h2 data-reveal><span>Conecte exposição, liquidação e</span> resultado<span> ao que acontece no físico</span></h2><div className={s.bentoVisual}><RiskScene /></div></article></div>
      </div></section>

      <section className={s.manifest} aria-labelledby="manifest-title"><div className={s.container}><p data-reveal>O que muda quando todos enxergam a mesma operação?</p><div><h2 id="manifest-title" data-reveal>Uma trading não precisa de mais telas. Precisa de continuidade.</h2><p data-reveal>Uma oferta aprovada altera o contrato. Uma carga recebida altera o estoque. A posição muda o risco; a liquidação chega ao caixa. O Tier Trade mantém essa história conectada para que cada decisão tenha contexto.</p></div></div></section>

      <div className={s.darkWorld} data-theme="dark">
        <section className={s.darkIntro} id="operacao"><div className={s.container}><h2 data-reveal>Uma nova forma de operar o agro.</h2><p data-reveal>Comercial, contratos, logística, estoque, risco e financeiro no mesmo ambiente. Cada área com a visão de que precisa, sem perder o elo com as outras.</p><div className={s.moduleLine} data-reveal>{modules.map((name, i) => <span key={name}><i>{String(i + 1).padStart(2, '0')}</i>{name}</span>)}</div><WorkflowScene /></div></section>

        <section className={s.darkSplit}><div className={s.container}><article><h3 data-reveal>Comece pelo que já existe na operação.</h3><p data-reveal>Contratos, saldos, cargas e posições entram em uma leitura única. O contexto deixa de morar em planilhas paralelas e conversas dispersas.</p><div className={s.supportScene} data-reveal><IntakeScene /></div></article><article><h3 data-reveal>Uma visão para cada função.</h3><p data-reveal>O trader acompanha oportunidades; operações vê o que precisa acontecer; a gestão acompanha exposição e resultado.</p><div className={s.supportScene} data-reveal><RolesScene /></div></article></div></section>

        <section className={s.darkTools}><div className={s.container}><div><h3 data-reveal>Do campo ao financeiro, sem perder o fio.</h3><p data-reveal>O mesmo contrato atravessa programação, recebimento, estoque, exposição e liquidação. O próximo passo já conhece o anterior.</p><div className={s.inlineFeatures}><Feature>Agenda ligada ao contrato</Feature><Feature>Rastreabilidade por carga e lote</Feature></div></div><div data-reveal><TraceScene /></div></div></section>

        <section className={s.darkShowcase}><div className={s.container}><h2 data-reveal>Toda a operação,<br />pronta para avançar.</h2><div className={s.threeFeatures}><Feature>Comercial com margem e alçada antes do aceite.</Feature><Feature>Execução física ligada a contratos e saldos.</Feature><Feature>Resultado que acompanha posição, risco e caixa.</Feature></div><div className={s.wideScene} data-reveal><PortfolioScene /></div></div></section>
      </div>

      <section className={s.principles}><div className={s.container}><article><span className={s.gem}>⌁</span><h3 data-reveal>Processos claros para todos.</h3><p data-reveal>Regras de aprovação, objetos conectados e histórico acessível para que a operação avance com segurança.</p></article><article><span className={s.gem}>✳</span><h3 data-reveal>Controle sem perder velocidade.</h3><p data-reveal>Alçadas e rastreabilidade entram no fluxo de trabalho, sem virar uma etapa separada da realidade.</p></article></div></section>

      <section className={s.management} id="gestao"><div className={s.container}><div className={s.managementHead}><div><h2 data-reveal>Sua gestão sempre por dentro.</h2><p data-reveal>Veja o que foi negociado, o que está em execução, onde a posição mudou e o que chega ao caixa. Sem esperar que alguém reconstrua o cenário.</p></div><div className={s.fan} aria-hidden="true"><span>COMERCIAL</span><span>OPERAÇÕES</span><span>RESULTADO</span></div></div><div className={s.managementFeatures}><Feature>Margem e aprovações no comercial</Feature><Feature>Contratos, saldos e obrigações</Feature><Feature>Cargas, qualidade e estoque</Feature><Feature>Exposição, liquidação e caixa</Feature></div><div className={s.wideScene} data-reveal><ManagementScene /></div></div></section>

      <section className={s.final} id="contato"><div className={s.finalGlow} /><div className={s.container}><h2 data-reveal>Mais clareza para decidir.<br />Mais fluidez para operar.</h2><p data-reveal>Conheça o Tier Trade aplicado à sua trading.</p><div data-reveal><Cta /></div></div><div className={s.flowRows} aria-hidden="true"><div>{[...modules, ...modules].map((n, i) => <span key={i}>{n}<b>→</b></span>)}</div><div>{[...modules.slice().reverse(), ...modules.slice().reverse()].map((n, i) => <span key={i}>{n}<b>→</b></span>)}</div></div></section>
    </main>
    <footer className={s.footer}><div className={s.container}><div><BrandLogo variant="dark" /><p>Da negociação ao caixa. A trading inteira no mesmo fluxo.</p></div><nav aria-label="Rodapé"><a href="#plataforma">Plataforma</a><a href="#operacao">Operação</a><a href="#gestao">Gestão</a><Link href="/login">Entrar</Link></nav><small>© 2026 Tier Trade</small></div></footer>
  </div>;
}
