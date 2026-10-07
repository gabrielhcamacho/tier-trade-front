import Link from 'next/link';
import { DetailNavigation } from '../../detail-navigation';
import { DemoNotice } from '../../demo-notice';
import { DemoSection, DemoStatus, DemoTable } from '../../demo-ui';

export function DemoLoadDetail({ loadId }: { loadId: string }) {
  return (
    <>
      <header className="entity-header load-demo-header">
        <DetailNavigation backHref="/cargas?modo=demonstracao" backLabel="Voltar às cargas" items={[{ label: 'Operações', href: '/cargas' }, { label: 'Cargas', href: '/cargas?modo=demonstracao' }, { label: loadId, mono: true }]} />
        <div className="entity-title-row"><div><p className="entity-kind">Carga de recebimento</p><h1>Milho · RBC-7H55 · Rodogrãos</h1><p className="entity-id">{loadId} · cenário demonstrativo</p></div><div className="entity-actions"><DemoStatus tone="attention">Contraprova concluída</DemoStatus><button className="tt-button" data-variant="primary" data-size="md" type="button" disabled>Registrar decisão</button></div></div>
        <dl className="entity-facts"><div><dt>Contrato</dt><dd>CT-2026-00512</dd></div><div><dt>Janela</dt><dd>06/10 · 10:30</dd></div><div><dt>Previsto</dt><dd>47.368 kg</dd></div><div><dt>Motorista</dt><dd>Marcos Vinícius</dd></div><div><dt>Destino</dt><dd>ARM-RV01</dd></div></dl>
        <ol className="trace-rail" aria-label="Etapas da carga"><Trace label="Programada" value="06/10 · 10:30" state="done" /><Trace label="Pesagem" value="47.620 kg" state="done" /><Trace label="Classificação" value="Contraprova" state="current" /><Trace label="Romaneio" value="Pendente" state="future" /><Trace label="NF-e" value="001.285" state="current" /><Trace label="Liquidação" value="Bloqueada" state="future" /></ol>
        <nav className="detail-tabs" aria-label="Cargas demonstrativas"><Link href="/cargas/CG-26-10421?modo=demonstracao">CG-26-10421 · Recebida</Link><Link className="active" aria-current="page" href={`/cargas/${loadId}?modo=demonstracao`}>{loadId} · Contraprova</Link><Link href="/cargas/CG-26-10423?modo=demonstracao">CG-26-10423 · Programada</Link></nav>
      </header>

      <div className="demo-page load-demo-page">
        <DemoNotice />
        <div className="demo-alert" data-tone="attention"><strong>Contestação registrada pelo produtor</strong><p>A contraprova reduziu a umidade de 15,4% para 15,1%. A decisão final preserva as duas medições e a regra aplicada.</p></div>
        <div className="load-detail-layout demo-load-layout">
          <div className="load-main-column">
            <DemoSection kicker="RECEBIMENTO" title="Pesagem" aside="Balança BR-02 · Unidade Rio Verde" id="pesagem"><dl className="weighing-grid"><div><dt>Peso bruto</dt><dd>63.480 kg</dd><small>entrada · 10:21</small></div><div><dt>Tara</dt><dd>15.860 kg</dd><small>saída · 11:07</small></div><div><dt>Peso líquido</dt><dd>47.620 kg</dd><small>793,6667 sc</small></div></dl></DemoSection>

            <DemoSection kicker="QUALIDADE" title="Classificação e desconto" aside="Tabela TQ-MI v3 · vigente desde 01/07/2026" id="qualidade">
              <DemoTable label="Classificação da carga" columns={['Item', 'Padrão', 'Medido', 'Excesso', 'Fator', 'Desconto']} rows={[
                ['Umidade · contraprova', '14,0%', '15,1%', '1,1 p.p.', '1,5', '1,65%'],
                ['Impureza', '1,0%', '1,3%', '0,3 p.p.', '1,0', '0,30%'],
                ['Avariados', '6,0%', '4,2%', '0,0 p.p.', '1,0', '0,00%'],
                ['Desconto total', '—', '—', '—', '—', <strong key="discount">1,95%</strong>],
              ]} />
              <div className="calculation-demo quality-calculation"><div><span /><div><strong>Peso líquido</strong><small>Balança BR-02</small></div><b>47.620 kg</b></div><div><span>×</span><div><strong>Desconto total</strong><small>TQ-MI v3</small></div><b>1,95%</b></div><div><span>=</span><div><strong>Desconto em peso</strong><small>arredondamento ao kg</small></div><b>929 kg</b></div><div data-total="true"><span>=</span><div><strong>Peso comercial</strong><small>778,1833 sc</small></div><b>46.691 kg</b></div><div data-total="true"><span>×</span><div><strong>Preço contratado</strong><small>CT-2026-00512</small></div><b>R$ 43.773,06</b></div></div>
            </DemoSection>

            <DemoSection kicker="DECISÃO" title="Medição original e contraprova" aside="Impacto calculado antes da decisão">
              <div className="comparison-grid"><article><span>Medição original</span><strong>15,4% de umidade</strong><dl><div><dt>Desconto total</dt><dd>2,40%</dd></div><div><dt>Desconto em peso</dt><dd>1.143 kg</dd></div><div><dt>Valor</dt><dd>R$ 43.572,42</dd></div></dl></article><article data-recommended="true"><span>Contraprova laboratorial</span><strong>15,1% de umidade</strong><dl><div><dt>Desconto total</dt><dd>1,95%</dd></div><div><dt>Desconto em peso</dt><dd>929 kg</dd></div><div><dt>Valor</dt><dd>R$ 43.773,06</dd></div></dl><small>R$ 200,64 a favor do produtor</small></article></div>
            </DemoSection>

            <DemoSection kicker="DOCUMENTO OPERACIONAL" title="Romaneio de recebimento" aside="Será emitido após a decisão"><dl className="detail-data-grid"><div><dt>Romaneio</dt><dd>RM-RV-26-08813</dd><small>rascunho</small></div><div><dt>NF-e vinculada</dt><dd>001.285</dd><small>autorizada</small></div><div><dt>Lote de destino</dt><dd>LT-RV-26-0313</dd><small>aguardando confirmação</small></div><div><dt>Liquidação</dt><dd>LQ-2026-01878</dd><small>bloqueada pela decisão</small></div></dl></DemoSection>
          </div>

          <aside className="load-side-column demo-side-stack">
            <section><p className="section-kicker">OBJETOS VINCULADOS</p><nav className="linked-objects"><Link href="/contratos?modo=demonstracao">Contrato <strong>CT-2026-00512</strong></Link><span>Romaneio <strong>RM-RV-26-08813</strong></span><span>NF-e <strong>001.285</strong></span><Link href="/estoque">Lote <strong>LT-RV-26-0313</strong></Link><span>Liquidação <strong>bloqueada</strong></span></nav></section>
            <section><p className="section-kicker">HISTÓRICO DA CARGA</p><ol className="activity-list"><li><time>14:05</time><div><strong>Contraprova concluída</strong><span>Laboratório da unidade · 15,1%</span></div></li><li><time>11:32</time><div><strong>Contestação registrada</strong><span>Camila Rocha · Originação</span></div></li><li><time>11:07</time><div><strong>Pesagem de saída</strong><span>BR-02 · tara 15.860 kg</span></div></li><li><time>10:35</time><div><strong>Amostra coletada</strong><span>AM-RV-26-1907</span></div></li></ol></section>
            <section><p className="section-kicker">PRÓXIMA AÇÃO</p><h2>Decidir a classificação</h2><p>Aceitar a contraprova libera romaneio, lote e liquidação. A ação permanece desabilitada até existir suporte na API.</p><button className="tt-button" data-variant="primary" data-size="md" type="button" disabled>Aceitar contraprova</button></section>
          </aside>
        </div>
      </div>
    </>
  );
}

function Trace({ label, value, state }: { label: string; value: string; state: 'done' | 'current' | 'future' }) {
  return <li data-state={state}><span aria-hidden="true" /><div><strong>{label}</strong><small>{value}</small></div></li>;
}
