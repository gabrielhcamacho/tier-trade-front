import Link from 'next/link';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { currentUserContext } from '../../lib/current-user';

const workItems = [
  {
    kind: 'Decisão',
    title: 'Comparar cenários e negociar OF-2026-0231',
    description: 'Milho · 1.800 t · Agropecuária Boa Vista · condição pedida R$ 56,25/sc',
    due: 'Hoje, 12:00',
    status: 'Em análise',
    tone: 'info',
    href: '/',
  },
  {
    kind: 'Documento',
    title: 'OF-2026-0229 · Fazenda Primavera',
    description: 'Soja · 2.400 t · aguardando comprovante de inscrição estadual',
    due: '02/10',
    status: 'Aguardando documento',
    tone: 'neutral',
    href: '/',
  },
  {
    kind: 'Investigação',
    title: 'Produtor contesta a umidade da CG-26-10422',
    description: 'Desconto aplicado 2,40% · impacto estimado de R$ 1.071,56',
    due: '06/10, 16:00',
    status: 'Vence em breve',
    tone: 'attention',
    href: '/cargas/CG-26-10422?modo=demonstracao',
  },
];

const activities = [
  ['10:18', 'Contrato CT-2026-00512 ativado', 'Patrícia Nunes · Contratos'],
  ['10:02', 'Condição comercial aprovada', 'Jorge Santos · Direção'],
  ['09:48', 'Oferta enviada para aprovação', 'Camila Rocha · Originação GO'],
  ['09:31', 'Cenário de margem recalculado', 'Política PC-MI-03 v2'],
];

export default async function CentralPage() {
  const { userLabel } = await currentUserContext();

  return (
    <AppShell activeDomain="central" userLabel={userLabel}>
      <header className="page-header central-header">
        <p className="breadcrumbs">Central <span>›</span> Minha fila</p>
        <div className="page-header-row">
          <div>
            <p className="entity-kind">Visão do trader</p>
            <h1>O que precisa da sua atenção</h1>
            <p className="page-description">Prioridades comerciais, decisões e exceções reunidas por prazo e impacto.</p>
          </div>
          <span className="environment-label">Mountier Agro · Unidade Rio Verde</span>
        </div>
      </header>

      <div className="demo-page">
        <DemoNotice />

        <section className="central-metrics" aria-label="Indicadores da carteira">
          <article><span>Ofertas abertas</span><strong>4</strong><small>1 originada pelo Mountier Agro</small></article>
          <article data-primary="true"><span>Margem prevista</span><strong>R$ 3,62 <em>/sc</em></strong><small>carteira de milho GO 25/26</small></article>
          <article><span>Volume em negociação</span><strong>8.700 <em>t</em></strong><small>compras e vendas em aberto</small></article>
          <article data-tone="attention"><span>Aguardando aprovação</span><strong>1</strong><small>fora da política de margem</small></article>
        </section>

        <section className="exception-summary" aria-label="Resumo de exceções">
          <span aria-hidden="true">1</span>
          <div><strong>Uma condição exige decisão da Direção</strong><p>R$ 102.000,00 de margem prevista vinculada à OF-2026-0231.</p></div>
          <a href="#aprovacoes">Ver aprovação</a>
        </section>

        <div className="central-layout">
          <div className="central-main-column">
            <section className="central-section" aria-labelledby="work-queue-title">
              <header><div><p className="section-kicker">PRIORIDADES</p><h2 id="work-queue-title">Fila de trabalho</h2></div><span>Ordenada por prazo e impacto</span></header>
              <div className="work-queue">
                {workItems.map((item, index) => (
                  <article key={item.title}>
                    <span className="queue-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="queue-copy"><small>{item.kind}</small><strong>{item.title}</strong><p>{item.description}</p></div>
                    <div className="queue-due"><small>Prazo</small><strong>{item.due}</strong></div>
                    <span className="demo-status" data-tone={item.tone}>{item.status}</span>
                    <Link href={item.href}>Abrir</Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="central-section" id="aprovacoes" aria-labelledby="approvals-title">
              <header><div><p className="section-kicker">ALÇADA COMERCIAL</p><h2 id="approvals-title">Aprovações</h2></div><span>A decisão material permanece humana</span></header>
              <article className="approval-preview">
                <div className="approval-heading"><span className="approval-flag">01</span><div><small>CONDIÇÃO FORA DA POLÍTICA</small><h3>OF-2026-0231 · milho 1.800 t</h3><p>Agropecuária Boa Vista · submetida por Camila Rocha</p></div><span className="demo-status" data-tone="attention">Aguardando</span></div>
                <dl>
                  <div><dt>Margem calculada</dt><dd>R$ 3,40/sc</dd><small>mínimo R$ 3,80/sc</small></div>
                  <div><dt>Margem no contrato</dt><dd>R$ 102.000,00</dd><small>30.000 sacas</small></div>
                  <div><dt>Validade da oferta</dt><dd>Hoje, 12:00</dd><small>SLA da alçada às 11:00</small></div>
                </dl>
                <footer><p>Aprovação demonstrativa; a decisão real continua disponível no fluxo comercial conectado.</p><Link className="tt-button" data-variant="primary" data-size="md" href="/">Analisar no Comercial</Link></footer>
              </article>
            </section>
          </div>

          <aside className="central-sidebar">
            <section id="alertas"><p className="section-kicker">ALERTAS E INTEGRAÇÕES</p><div className="demo-alert" data-tone="attention"><strong>B3 com atraso de 15 min</strong><p>Preços de referência usam a última cotação registrada.</p></div><div className="demo-alert"><strong>Regra tributária não homologada</strong><p>RT-EX-01 aparece apenas no cenário demonstrativo de liquidação.</p></div></section>
            <section><p className="section-kicker">ATIVIDADE RECENTE</p><ol className="activity-list">{activities.map(([time, title, by]) => <li key={title}><time>{time}</time><div><strong>{title}</strong><span>{by}</span></div></li>)}</ol></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
