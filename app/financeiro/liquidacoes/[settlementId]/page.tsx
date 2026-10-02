import Link from 'next/link';
import { AppShell } from '../../../app-shell';
import { DemoNotice } from '../../../demo-notice';
import { currentUserContext } from '../../../../lib/current-user';

const calculationRows = [
  ['', 'Quantidade aceita', '48.000 kg · 800,0000 sc', 'Romaneio RM-RV-26-08812'],
  ['×', 'Preço contratado', 'R$ 56,25/sc', 'CT-2026-00512 · cláusula 4.1'],
  ['=', 'Valor da mercadoria', 'R$ 45.000,00', 'NF-e 001.284'],
  ['−', 'Desconto de qualidade', 'R$ 0,00', 'Tabela TQ-MI v3'],
  ['−', 'Retenção RT-EX-01 · 0,20%', 'R$ 90,00', 'regra demonstrativa v1'],
  ['=', 'Valor líquido ao fornecedor', 'R$ 44.910,00', 'Título TP-2026-04412'],
];

const reconciliationRows = [
  ['Quantidade (kg)', '48.000', '48.000', '48.000', '—', '—', '—', '48.000'],
  ['Valor bruto', '45.000,00', '45.000,00', '45.000,00', '45.000,00', '—', '—', '45.000,00'],
  ['Retenção', '—', '—', '—', '90,00', '—', '90,00', '90,00'],
  ['Valor líquido', '—', '—', '—', '44.910,00', 'pendente', '—', '44.910,00'],
];

export default async function SettlementDetailPage({ params }: { params: Promise<{ settlementId: string }> }) {
  const [{ settlementId }, { userLabel }] = await Promise.all([params, currentUserContext()]);

  return (
    <AppShell activeDomain="financial" userLabel={userLabel}>
      <header className="entity-header settlement-header">
        <p className="breadcrumbs">Financeiro <span>›</span> Liquidações <span>›</span> {settlementId}</p>
        <div className="entity-title-row">
          <div><p className="entity-kind">Liquidação de compra</p><h1>CG-26-10421 · Agropecuária Boa Vista</h1><p className="entity-id">{settlementId} · cenário de demonstração</p></div>
          <span className="demo-status" data-tone="attention">Aguardando aprovação</span>
        </div>
        <dl className="entity-facts">
          <div><dt>Contrato</dt><dd>CT-2026-00512</dd></div><div><dt>Carga</dt><dd>CG-26-10421</dd></div><div><dt>NF-e</dt><dd>001.284</dd></div><div><dt>Título</dt><dd>TP-2026-04412</dd></div><div><dt>Vencimento</dt><dd>13/10/2026</dd></div>
        </dl>
        <ol className="trace-rail settlement-trace" aria-label="Rastreabilidade da liquidação">
          <li data-state="done"><span /><div><strong>Carga</strong><small>48.000 kg</small></div></li>
          <li data-state="done"><span /><div><strong>NF-e</strong><small>R$ 45.000,00</small></div></li>
          <li data-state="current"><span /><div><strong>Liquidação</strong><small>Em aprovação</small></div></li>
          <li><span /><div><strong>Título</strong><small>R$ 44.910,00</small></div></li>
          <li><span /><div><strong>Banco</strong><small>pendente</small></div></li>
          <li data-state="current"><span /><div><strong>Tributo</strong><small>R$ 90,00</small></div></li>
          <li data-state="current"><span /><div><strong>Contábil</strong><small>provisionado</small></div></li>
        </ol>
      </header>

      <div className="demo-page settlement-page">
        <DemoNotice />
        <div className="demo-alert" data-tone="attention"><strong>Regra RT-EX-01 é um parâmetro demonstrativo</strong><p>Alíquota, base e responsabilidade dependem de homologação fiscal antes de qualquer uso produtivo.</p></div>

        <div className="settlement-layout">
          <div className="settlement-main">
            <section className="detail-section"><header><div><p className="section-kicker">CÁLCULO DETERMINÍSTICO</p><h2>Memória de cálculo</h2></div><span className="data-source">Contrato, carga e regra versionada</span></header><div className="calculation-demo">{calculationRows.map(([operator, label, value, source], index) => <div key={label} data-total={operator === '=' && index > 2 ? 'true' : undefined}><span>{operator}</span><div><strong>{label}</strong><small>{source}</small></div><b>{value}</b></div>)}</div><p className="detail-note">A mesma entrada, regra e versão sempre produzem o mesmo resultado.</p></section>

            <section className="detail-section"><header><div><p className="section-kicker">DESDOBRAMENTO FINANCEIRO</p><h2>Valor líquido e obrigação tributária</h2></div></header><div className="financial-groups"><article><h3>Título a pagar · TP-2026-04412</h3><dl><div><dt>Favorecido</dt><dd>Agropecuária Boa Vista Ltda.</dd></div><div><dt>Valor</dt><dd>R$ 44.910,00</dd></div><div><dt>Vencimento</dt><dd>13/10/2026 · D+5 úteis</dd></div><div><dt>Status</dt><dd><span className="demo-status">Em aberto</span></dd></div></dl></article><article><h3>Obrigação tributária · OT-2026-00931</h3><dl><div><dt>Origem</dt><dd>Retenção sobre NF-e 001.284</dd></div><div><dt>Valor</dt><dd>R$ 90,00</dd></div><div><dt>Competência</dt><dd>10/2026</dd></div><div><dt>Status</dt><dd><span className="demo-status" data-tone="info">Provisionada</span></dd></div></dl></article></div></section>

            <section className="detail-section"><header><div><p className="section-kicker">RASTREABILIDADE</p><h2>Conciliação ponta a ponta</h2></div><span className="data-source">Tolerância R$ 0,01</span></header><div className="reconciliation-wrap"><table className="reconciliation-table"><thead><tr><th>Medida</th><th>Contrato</th><th>Carga</th><th>NF-e</th><th>Título</th><th>Banco</th><th>Tributo</th><th>Contábil</th></tr></thead><tbody>{reconciliationRows.map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={index}>{cell}</th> : <td key={index} data-pending={cell === 'pendente' ? 'true' : undefined}>{cell}</td>)}</tr>)}</tbody></table></div></section>

            <section className="detail-section"><header><div><p className="section-kicker">ECONOMIA DO CONTRATO</p><h2>Margem projetada e realizada</h2></div></header><div className="central-metrics settlement-metrics"><article><span>Margem prevista</span><strong>R$ 102 mil</strong><small>R$ 3,40/sc</small></article><article><span>Margem comprometida</span><strong>R$ 2.720</strong><small>800 sacas recebidas</small></article><article data-primary="true"><span>Margem realizada</span><strong>R$ 2.720</strong><small>primeira carga</small></article><article><span>Pago ao produtor</span><strong>R$ 0,00</strong><small>aguardando aprovação</small></article></div></section>
          </div>

          <aside className="settlement-sidebar">
            <section><p className="section-kicker">VALIDAÇÃO DE DOCUMENTOS</p><ul className="document-checks"><li data-done="true">Contrato ativo e saldo disponível<small>CT-2026-00512</small></li><li data-done="true">NF-e autorizada na SEFAZ GO<small>chave 5226…1284</small></li><li data-done="true">Romaneio e peso líquido<small>RM-RV-26-08812</small></li><li data-done="true">Laudo de classificação<small>dentro do padrão</small></li><li data-done="true">Dados bancários e titularidade<small>sem alteração recente</small></li></ul></section>
            <section><p className="section-kicker">APROVAÇÃO DO PAGAMENTO</p><ol className="approval-timeline"><li data-state="done"><strong>Liquidação preparada</strong><span>Lucas Andrade · 07/10 08:50</span></li><li data-state="done"><strong>Documentos validados</strong><span>Renata Prado · 07/10 09:10</span></li><li data-state="current"><strong>Aprovação financeira</strong><span>segregação entre preparador e aprovador</span></li><li><strong>Remessa bancária</strong><span>Banco 341 · CNAB</span></li></ol><button className="tt-button" data-variant="primary" data-size="md" type="button" disabled title="Disponível quando o backend financeiro for implementado">Aprovar pagamento</button></section>
            <section><p className="section-kicker">OBJETOS VINCULADOS</p><nav className="linked-objects" aria-label="Objetos vinculados"><Link href="/contratos">Contrato <strong>CT-2026-00512</strong></Link><Link href="/cargas">Carga <strong>CG-26-10421</strong></Link><span>NF-e <strong>001.284</strong></span><span>Título <strong>TP-2026-04412</strong></span></nav></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
