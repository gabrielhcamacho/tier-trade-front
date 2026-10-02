import Link from 'next/link';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoPageHeader, DemoSection, DemoStatus, DemoTable } from '../demo-ui';

const contracts = [
  ['CT-2026-00512', 'Compra', 'Milho', 'Agropecuária Boa Vista', '30.000 sc', 'R$ 56,25/sc', <DemoStatus tone="positive" key="active">Ativo</DemoStatus>],
  ['CT-2026-00496', 'Venda', 'Milho', 'Aviagro Alimentos', '42.000 sc', 'R$ 63,80/sc', <DemoStatus tone="info" key="delivery">Em execução</DemoStatus>],
  ['CT-2026-00481', 'Compra', 'Soja', 'Fazenda Primavera', '18.500 sc', 'R$ 121,40/sc', <DemoStatus tone="attention" key="signature">Assinatura pendente</DemoStatus>],
  ['CT-2026-00452', 'Compra', 'Milho', 'Cooperativa Vale Verde', '12.800 sc', 'R$ 55,90/sc', <DemoStatus key="closed">Encerrado</DemoStatus>],
];

const obligations = [
  ['Contrato assinado pelas partes', 'Patrícia Nunes', '01/10/2026', <DemoStatus tone="positive" key="done-1">Concluída</DemoStatus>],
  ['Agenda de entrega validada', 'Lucas Ferreira', '03/10/2026', <DemoStatus tone="positive" key="done-2">Concluída</DemoStatus>],
  ['Comprovante de inscrição estadual', 'Camila Rocha', '02/10/2026', <DemoStatus tone="attention" key="pending-1">Vence hoje</DemoStatus>],
  ['Garantia contratual', 'Renata Prado', '04/10/2026', <DemoStatus tone="info" key="analysis">Em análise</DemoStatus>],
];

export function DemoContractsPortfolio() {
  return (
    <>
      <DemoPageHeader domain="Contratos" section="Carteira" eyebrow="Gestão contratual" title="Contratos e obrigações" description="Acompanhe formalização, execução, saldos e pendências da carteira contratual." />
      <div className="demo-page demo-workspace">
        <DemoNotice />
        <DemoMetricStrip items={[
          { label: 'Contratos ativos', value: '14', detail: '9 compras · 5 vendas', tone: 'primary' },
          { label: 'Volume contratado', value: '184.700', unit: 't', detail: 'soja e milho' },
          { label: 'Obrigações próximas', value: '6', detail: 'duas vencem em 48 horas', tone: 'attention' },
          { label: 'Margem projetada', value: 'R$ 1,84', unit: 'mi', detail: 'carteira do mês' },
        ]} />

        <div className="demo-filterbar" aria-label="Filtros aplicados"><span>Safra <strong>2025/26</strong></span><span>Unidade <strong>Rio Verde</strong></span><span>Commodity <strong>Todas</strong></span><span>Status <strong>Todos</strong></span></div>

        <div className="demo-domain-layout">
          <div className="demo-main-stack">
            <DemoSection kicker="CARTEIRA" title="Contratos recentes" aside="4 de 14 contratos">
              <DemoTable label="Contratos recentes" columns={['Contrato', 'Operação', 'Commodity', 'Contraparte', 'Volume', 'Preço', 'Status']} rows={contracts.map((row) => row.map((cell, index) => index === 0 ? <Link key={String(cell)} href="/cargas?modo=demonstracao">{cell}</Link> : cell))} />
              <div className="demo-table-actions"><span>Valores apresentados para validação visual do produto.</span><Link className="tt-button" data-variant="primary" data-size="md" href="/cargas?modo=demonstracao">Abrir execução física</Link></div>
            </DemoSection>

            <DemoSection kicker="EXECUÇÃO CONTRATUAL" title="Obrigações e prazos" aside="Ordenadas por vencimento" id="obrigacoes">
              <DemoTable label="Obrigações contratuais" columns={['Obrigação', 'Responsável', 'Prazo', 'Status']} rows={obligations} />
            </DemoSection>

            <DemoSection kicker="DOCUMENTOS" title="Documentos vinculados" aside="Versão e origem preservadas" id="documentos">
              <div className="document-ledger">
                <article><span className="document-mark">PDF</span><div><strong>Contrato CT-2026-00512 · versão assinada</strong><p>Modelo TPL-COMPRA-MI v4 · duas assinaturas verificadas</p></div><DemoStatus tone="positive">Vigente</DemoStatus></article>
                <article><span className="document-mark">DOC</span><div><strong>Confirmação comercial CF-2026-00819</strong><p>Origem OF-2026-0231 · aprovada por Jorge Santos</p></div><DemoStatus tone="positive">Conferida</DemoStatus></article>
                <article><span className="document-mark">CAD</span><div><strong>Inscrição estadual da contraparte</strong><p>Documento solicitado em 01/10 · aguardando envio</p></div><DemoStatus tone="attention">Pendente</DemoStatus></article>
              </div>
            </DemoSection>
          </div>

          <aside className="demo-side-stack">
            <section><p className="section-kicker">CONTRATO EM DESTAQUE</p><h2>CT-2026-00512</h2><p>Compra de milho · 30.000 sc · Agropecuária Boa Vista.</p><dl className="summary-ledger"><div><dt>Entregue</dt><dd>1.588,1 sc</dd></div><div><dt>Saldo</dt><dd>28.411,9 sc</dd></div><div><dt>Margem</dt><dd>R$ 3,40/sc</dd></div><div><dt>Próxima carga</dt><dd>07/10 08:00</dd></div></dl><Link className="operational-link" href="/cargas?modo=demonstracao">Ver agenda <span>→</span></Link></section>
            <section><p className="section-kicker">EXCEÇÕES</p><div className="demo-alert" data-tone="attention"><strong>Um documento vence hoje</strong><p>A inscrição estadual bloqueia a liberação documental do contrato CT-2026-00481.</p></div></section>
          </aside>
        </div>
      </div>
    </>
  );
}
