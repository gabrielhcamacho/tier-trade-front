import Link from 'next/link';
import { AppShell } from '../app-shell';
import { DemoNotice } from '../demo-notice';
import { currentUserContext } from '../../lib/current-user';

const routes = [
  ['01', 'Central', 'Prioridades, aprovações e exceções do trader.', '/central', 'Visão executiva'],
  ['02', 'Comercial', 'Oferta, formação do preço, margem e aprovação.', '/', 'Fluxo conectado'],
  ['03', 'Contratos', 'Carteira, obrigações, saldo e documentos.', '/contratos?modo=demonstracao', 'Demonstração'],
  ['04', 'Operações', 'Agenda de cargas, capacidade e execução física.', '/cargas?modo=demonstracao', 'Demonstração'],
  ['05', 'Carga detalhada', 'Pesagem, qualidade, desconto e contraprova.', '/cargas/CG-26-10422?modo=demonstracao', 'Demonstração'],
  ['06', 'Estoque', 'Posição física, lotes e reconciliação.', '/estoque', 'Demonstração'],
  ['07', 'Risco', 'Exposição, cobertura e limites da carteira.', '/risco', 'Demonstração'],
  ['08', 'Financeiro', 'Liquidações, contas e projeção de caixa.', '/financeiro', 'Demonstração'],
  ['09', 'Liquidação detalhada', 'Memória de cálculo e rastreabilidade financeira.', '/financeiro/liquidacoes/LQ-2026-01877', 'Demonstração'],
];

export default async function DemonstrationPage() {
  const { userLabel } = await currentUserContext();

  return (
    <AppShell activeDomain="central" userLabel={userLabel}>
      <header className="page-header demo-catalog-header"><p className="breadcrumbs">Central <span>›</span> Roteiro de demonstração</p><div className="page-header-row"><div><p className="entity-kind">Produto navegável</p><h1>Tier Trade, de ponta a ponta</h1><p className="page-description">Uma sequência visual para apresentar o valor do produto sem depender de integrações ainda não implementadas.</p></div><span className="environment-label">9 momentos · cerca de 12 minutos</span></div></header>
      <div className="demo-page demo-catalog-page">
        <DemoNotice />
        <section className="demo-story-intro"><div><p className="section-kicker">NARRATIVA SUGERIDA</p><h2>Da oportunidade comercial ao caixa conciliado</h2></div><p>Comece pela fila do trader, avance pela oferta e pelo contrato, mostre a execução física e encerre com estoque, risco e liquidação. Cada tela mantém a referência do objeto de negócio anterior.</p></section>
        <ol className="demo-route-catalog">
          {routes.map(([index, title, description, href, type]) => <li key={index}><span className="demo-route-index">{index}</span><div><small>{type}</small><h2>{title}</h2><p>{description}</p></div><Link href={href}>Abrir tela <span>→</span></Link></li>)}
        </ol>
        <section className="demo-catalog-note"><p className="section-kicker">USO COMERCIAL</p><div><strong>As capturas desta sequência ficam versionadas com o front-end.</strong><p>Elas podem ser usadas como base visual da landing page e de materiais de apresentação; textos, marcas e dados continuam sujeitos à validação final.</p></div></section>
      </div>
    </AppShell>
  );
}
