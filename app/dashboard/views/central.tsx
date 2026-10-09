import { ProgressList } from '../charts';
import { commodity, fmt, list, num, ratio } from '../format';
import { Grid, Panel, RecordList } from '../ui';
import { DueColumns, MarginBars } from './shared';
import { attention, critical, plural, type ViewInput, type ViewOutput } from './types';

export function centralView({ indicators: i, breakdowns }: ViewInput): ViewOutput {
  const contracted = num(i.purchaseContractedKg);
  const received = num(i.purchaseReceivedKg);
  const critOcc = num(i.criticalOccurrences);
  const areas = [
    { key: 'commercial', title: 'Comercial', meta: 'Ofertas aguardando aprovação', count: num(i.pendingApprovals), href: '/ofertas' },
    { key: 'contracts', title: 'Contratos', meta: 'Obrigações contratuais em aberto', count: num(i.openObligations ?? i.pendingObligations), href: '/contratos/obrigacoes' },
    { key: 'operations', title: 'Operações', meta: `Ocorrências abertas${critOcc ? ` (${critOcc === 1 ? '1 crítica' : `${critOcc} críticas`})` : ''} e revisões de qualidade`, count: num(i.openOccurrences) + num(i.qualityReviews), href: '/ocorrencias', tone: critOcc ? 'critical' as const : undefined },
    { key: 'risk', title: 'Risco', meta: 'Limites em atenção ou excedidos', count: num(i.riskAttention), href: '/risco/visao-geral' },
    { key: 'financial', title: 'Financeiro', meta: 'Lotes em aprovação e itens sem conciliação', count: num(i.paymentBatchesPendingApproval) + num(i.unmatchedBankEntries), href: '/financeiro/visao-geral' },
    { key: 'fiscal', title: 'Fiscal', meta: 'Documentos recebidos ou rejeitados', count: num(i.fiscalReviews), href: '/fiscal/visao-geral' },
  ].sort((a, b) => Number(b.count > 0) - Number(a.count > 0));

  return {
    kpis: [
      { key: 'margin', label: 'Margem projetada', value: fmt.moneyShort(i.projectedMarginAmount), note: plural(num(i.activeContracts), 'contrato ativo', 'contratos ativos'), href: '/contratos?view=economics', tip: `Margem projetada\n${fmt.money(i.projectedMarginAmount)}` },
      { key: 'received', label: 'Volume recebido', value: fmt.tonnes(received), progress: ratio(received, contracted), note: `${fmt.pct(ratio(received, contracted))} de ${fmt.tonnes(contracted)} contratadas`, href: '/contratos?view=deliveries' },
      { key: 'receivable', label: 'A receber', value: fmt.moneyShort(i.receivableAmount), note: `A pagar ${fmt.moneyShort(i.payableAmount)}`, href: '/financeiro/visao-geral', tip: `A receber ${fmt.money(i.receivableAmount)}\nA pagar ${fmt.money(i.payableAmount)}` },
      { key: 'approvals', label: 'Aprovações pendentes', value: fmt.int(i.pendingApprovals), tone: attention(num(i.pendingApprovals)), note: 'ofertas aguardando alçada', href: '/ofertas' },
      { key: 'occurrences', label: 'Ocorrências abertas', value: fmt.int(i.openOccurrences), tone: critical(critOcc) ?? attention(num(i.openOccurrences)), note: critOcc ? plural(critOcc, 'crítica', 'críticas') : 'nenhuma crítica', href: '/ocorrencias' },
      { key: 'fiscal', label: 'Revisões fiscais', value: fmt.int(i.fiscalReviews), tone: attention(num(i.fiscalReviews)), note: 'documentos a validar ou corrigir', href: '/fiscal?view=validation' },
    ],
    body: (
      <Grid>
        <Panel span={7} title="Execução física por commodity" subtitle="Compras e vendas ativas, contratado contra executado" action={{ href: '/contratos?view=deliveries', label: 'Ver entregas' }}>
          <ProgressList
            doneLabel="Recebido ou expedido"
            empty="Sem contratos de compra ou venda ativos."
            rows={list(breakdowns, 'flowByCommodity').flatMap((row) => {
              const name = commodity(row.commodity);
              const buy = num(row.purchase_contracted_kg);
              const sell = num(row.sales_contracted_kg);
              return [
                { key: `${row.commodity}-buy`, label: `${name} · compra`, total: buy, done: num(row.purchase_received_kg), display: fmt.pct(ratio(num(row.purchase_received_kg), buy)), detail: `${fmt.tonnes(row.purchase_received_kg)} de ${fmt.tonnes(buy)}` },
                { key: `${row.commodity}-sell`, label: `${name} · venda`, total: sell, done: num(row.sales_dispatched_kg), display: fmt.pct(ratio(num(row.sales_dispatched_kg), sell)), detail: `${fmt.tonnes(row.sales_dispatched_kg)} de ${fmt.tonnes(sell)}` },
              ];
            })}
          />
        </Panel>
        <Panel span={5} title="Pendências por área" subtitle="Itens que dependem de uma decisão">
          <RecordList
            empty="Nenhuma pendência registrada."
            rows={areas.map((area) => ({
              key: area.key, title: area.title, meta: area.meta, href: area.href,
              value: area.count ? fmt.int(area.count) : 'Em dia',
              tone: area.count ? area.tone ?? 'attention' : undefined,
            }))}
          />
        </Panel>
        <Panel span={7} title="Vencimentos financeiros" subtitle="Títulos em aberto nas próximas oito semanas" action={{ href: '/financeiro?view=cashflow', label: 'Fluxo de caixa' }}>
          <DueColumns breakdowns={breakdowns} />
        </Panel>
        <Panel span={5} title="Margem projetada por contrato" subtitle="Contratos de compra ativos" action={{ href: '/contratos?view=economics', label: 'Custos e margem' }}>
          <MarginBars breakdowns={breakdowns} />
        </Panel>
      </Grid>
    ),
  };
}
