import { BarList, Columns, Legend, SegmentBar, palette } from '../charts';
import { dates, fmt, list, num, party, text } from '../format';
import { Grid, Panel } from '../ui';
import styles from '../dashboard.module.css';
import { DueColumns } from './shared';
import { attention, plural, type ViewInput, type ViewOutput } from './types';

const agingBuckets: Array<[string, string, string]> = [
  ['CURRENT', 'A vencer', 'var(--viz-1)'],
  ['D1_30', '1 a 30 dias', '#e3a07f'],
  ['D31_60', '31 a 60 dias', '#cc6a43'],
  ['D61_PLUS', 'Mais de 60 dias', 'var(--state-critical)'],
];

export function financialView({ indicators: i, breakdowns }: ViewInput): ViewOutput {
  const receivable = num(i.receivableAmount);
  const payable = num(i.payableAmount);
  const overdueIn = num(i.overdueReceivableAmount);
  const overdueOut = num(i.overduePayableAmount);
  const cash = list(breakdowns, 'cashByMonth');
  const aging = list(breakdowns, 'aging');
  const top = list(breakdowns, 'topReceivables');
  const amount = (direction: string, bucket: string) =>
    num(aging.find((row) => row.direction === direction && row.bucket === bucket)?.amount);

  return {
    kpis: [
      { key: 'receivable', label: 'A receber', value: fmt.moneyShort(receivable), tone: overdueIn > 0 ? 'attention' : undefined, note: overdueIn > 0 ? `${fmt.moneyShort(overdueIn)} vencidos` : 'nenhum título vencido', href: '/financeiro?view=receivables', tip: `A receber\n${fmt.money(receivable)}` },
      { key: 'payable', label: 'A pagar', value: fmt.moneyShort(payable), tone: overdueOut > 0 ? 'attention' : undefined, note: overdueOut > 0 ? `${fmt.moneyShort(overdueOut)} vencidos` : 'nenhum título vencido', href: '/financeiro?view=payables', tip: `A pagar\n${fmt.money(payable)}` },
      { key: 'net', label: 'Saldo dos títulos', value: fmt.moneyShort(receivable - payable), note: 'a receber menos a pagar', href: '/financeiro?view=cashflow', tip: `Saldo dos títulos em aberto\n${fmt.money(receivable - payable)}` },
      { key: 'received', label: 'Recebido em 30 dias', value: fmt.moneyShort(i.receivedLast_30Days ?? i.receivedAmount), note: `Pago ${fmt.moneyShort(i.paidLast_30Days ?? i.paidAmount)}`, href: '/financeiro?view=cashflow' },
      { key: 'batches', label: 'Lotes em aprovação', value: fmt.int(i.paymentBatchesPendingApproval), tone: attention(num(i.paymentBatchesPendingApproval)), note: num(i.paymentBatchesPendingAmount) > 0 ? `${fmt.moneyShort(i.paymentBatchesPendingAmount)} aguardando alçada` : 'aguardando alçada', href: '/financeiro' },
      { key: 'reconciliation', label: 'Itens não conciliados', value: fmt.int(i.unmatchedBankEntries), tone: attention(num(i.unmatchedBankEntries)), note: `${plural(num(i.matchedBankEntries), 'conciliado', 'conciliados')}`, href: '/financeiro?view=reconciliation' },
    ],
    body: (
      <Grid>
        <Panel span={8} title="Vencimentos" subtitle="Saldo em aberto por semana de vencimento" action={{ href: '/financeiro?view=cashflow', label: 'Fluxo de caixa' }}>
          <DueColumns breakdowns={breakdowns} />
        </Panel>
        <Panel span={4} title="Envelhecimento" subtitle="Saldo em aberto por atraso" action={{ href: '/financeiro?view=receivables', label: 'Ver títulos' }}>
          <div className={styles.stackRows}>
            {[['INFLOW', 'A receber'], ['OUTFLOW', 'A pagar']].map(([direction, title]) => (
              <SegmentBar
                key={direction}
                title={`${title} · ${fmt.moneyShort(agingBuckets.reduce((sum, [bucket]) => sum + amount(direction!, bucket), 0))}`}
                empty={`${title}: nenhum título em aberto.`}
                legend={false}
                segments={agingBuckets.map(([bucket, label, color]) => ({
                  key: bucket, label, color, value: amount(direction!, bucket), display: fmt.money(amount(direction!, bucket)),
                }))}
              />
            ))}
            <Legend items={agingBuckets.map(([, label, color]) => ({ label, color }))} />
          </div>
        </Panel>
        <Panel span={7} title="Caixa realizado" subtitle="Recebimentos e pagamentos por mês, últimos seis meses" action={{ href: '/financeiro?view=settlements', label: 'Liquidações' }}>
          <Columns
            label="Recebimentos e pagamentos por mês"
            empty="Nenhum recebimento ou pagamento nos últimos seis meses."
            format={(value) => fmt.moneyShort(value)}
            height={170}
            categories={cash.map((row, index) => ({
              key: text(row.month),
              label: dates.monthYear(row.month),
              emphasis: index === cash.length - 1,
              values: { received: num(row.received), paid: num(row.paid) },
              tip: `${dates.monthYear(row.month)}\nRecebido: ${fmt.money(row.received)}\nPago: ${fmt.money(row.paid)}\nSaldo: ${fmt.money(num(row.received) - num(row.paid))}`,
            }))}
            series={[
              { key: 'received', label: 'Recebido', color: palette.primary },
              { key: 'paid', label: 'Pago', color: palette.tertiary, negative: true },
            ]}
          />
        </Panel>
        <Panel span={5} title="Maiores saldos a receber" subtitle="Por contraparte" action={{ href: '/financeiro?view=receivables', label: 'Contas a receber' }}>
          <BarList
            empty="Nenhum saldo a receber."
            rows={top.map((row) => ({
              key: text(row.id, text(row.name)),
              label: party(row.name),
              sublabel: `${plural(num(row.titles), 'título', 'títulos')}${num(row.overdue_amount) > 0 ? ` · ${fmt.moneyShort(row.overdue_amount)} vencidos` : ''}`,
              value: num(row.amount),
              display: fmt.moneyShort(row.amount),
              tip: `${party(row.name)}\nEm aberto: ${fmt.money(row.amount)}\nVencido: ${fmt.money(row.overdue_amount)}`,
            }))}
          />
        </Panel>
      </Grid>
    ),
  };
}
