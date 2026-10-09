import { BarList, Columns, palette } from '../charts';
import { commodity, dates, fmt, list, num, party, text } from '../format';

/** Open titles by due week, receivables above the baseline and payables below. */
export function DueColumns({ breakdowns }: { breakdowns: Record<string, unknown> }) {
  const rows = list(breakdowns, 'dueByWeek');
  const categories = rows.map((row, index) => {
    const overdue = row.bucket === 'OVERDUE';
    const inflow = num(row.inflow);
    const outflow = num(row.outflow);
    const label = overdue ? 'Vencidos' : dates.numeric(row.week);
    return {
      key: overdue ? 'overdue' : text(row.week, String(index)),
      label,
      sublabel: overdue ? 'em aberto' : index === 1 ? 'esta semana' : undefined,
      values: { inflow, outflow },
      emphasis: overdue && inflow + outflow > 0,
      tip: `${overdue ? 'Vencidos em aberto' : `Semana de ${dates.dayMonth(row.week)}`}\nA receber: ${fmt.money(inflow)}\nA pagar: ${fmt.money(outflow)}`,
    };
  });
  return (
    <Columns
      label="Vencimentos financeiros por semana"
      categories={categories}
      series={[
        { key: 'inflow', label: 'A receber', color: palette.primary },
        { key: 'outflow', label: 'A pagar', color: palette.tertiary, negative: true },
      ]}
      format={(value) => fmt.moneyShort(value)}
      empty="Nenhum título em aberto vence nas próximas oito semanas."
    />
  );
}

/** Projected margin of each active purchase contract. */
export function MarginBars({ breakdowns }: { breakdowns: Record<string, unknown> }) {
  const rows = list(breakdowns, 'marginByContract');
  return (
    <BarList
      empty="Sem contratos ativos com margem projetada."
      rows={rows.map((row) => ({
        key: text(row.contract_id),
        label: party(row.counterparty),
        sublabel: `${row.external_number ? `${text(row.external_number)} · ` : ''}${commodity(row.commodity)} · ${fmt.perSc(row.margin_per_sc)}`,
        value: num(row.amount),
        display: fmt.moneyShort(row.amount),
        href: `/contratos/${text(row.contract_id)}`,
        tip: `${party(row.counterparty)}\n${fmt.sacks(row.quantity_sc)} × ${fmt.perSc(row.margin_per_sc)}\n${fmt.money(row.amount)}`,
      }))}
    />
  );
}
