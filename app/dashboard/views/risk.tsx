import { Status } from '@mountier/tier-trade-design-system';
import { Columns, Legend, MeterList, palette } from '../charts';
import { commodity, dates, fmt, hasValue, list, num, text } from '../format';
import { Grid, Note, Panel } from '../ui';
import styles from '../dashboard.module.css';
import { attention, critical, type ViewInput, type ViewOutput } from './types';

const statusInfo: Record<string, { label: string; tone: 'positive' | 'warning' | 'critical' | 'neutral' }> = {
  OK: { label: 'Dentro do limite', tone: 'positive' },
  WARNING: { label: 'Em atenção', tone: 'warning' },
  EXCEEDED: { label: 'Excedido', tone: 'critical' },
  UNCONFIGURED: { label: 'Sem limite', tone: 'neutral' },
};
const unavailableNames: Record<string, string> = {
  MTM: 'marcação a mercado', 'P&L': 'resultado', PRICE_EXPOSURE: 'exposição a preço', BASE_EXPOSURE: 'exposição a base',
  FX_EXPOSURE: 'exposição cambial', VAR: 'VaR',
};

export function riskView({ indicators: i, breakdowns, unavailable }: ViewInput): ViewOutput {
  const positions = list(breakdowns, 'positions');
  const exposure = list(breakdowns, 'exposureByMonth');
  const top = [...positions].sort((a, b) => num(b.utilization_pct) - num(a.utilization_pct))[0];
  const maxUse = hasValue(i.maxUtilizationPct) ? num(i.maxUtilizationPct) : top && hasValue(top.utilization_pct) ? num(top.utilization_pct) : null;
  const netOpen = hasValue(i.netOpenKg) ? num(i.netOpenKg) : positions.reduce((sum, row) => sum + num(row.net_open_kg), 0);
  const scale = Math.max(1, ...positions.flatMap((row) => [num(row.purchase_kg), num(row.sales_kg)]));

  return {
    kpis: [
      { key: 'net', label: 'Posição líquida aberta', value: fmt.tonnes(netOpen), note: `${fmt.int(i.commodityCount)} ${num(i.commodityCount) === 1 ? 'commodity monitorada' : 'commodities monitoradas'}`, href: '/risco' },
      { key: 'use', label: 'Maior uso de limite', value: maxUse === null ? '—' : fmt.pct(maxUse), progress: maxUse === null ? undefined : maxUse, tone: top?.status === 'EXCEEDED' ? 'critical' : top?.status === 'WARNING' ? 'attention' : undefined, note: top ? commodity(top.commodity) : 'sem posições', href: '/risco?view=limits' },
      { key: 'warning', label: 'Limites em atenção', value: fmt.int(i.warningCount), tone: attention(num(i.warningCount)), note: 'acima do gatilho de alerta', href: '/risco?view=limits' },
      { key: 'exceeded', label: 'Limites excedidos', value: fmt.int(i.exceededCount), tone: critical(num(i.exceededCount)), note: 'exigem redução de posição', href: '/risco?view=limits' },
      { key: 'unconfigured', label: 'Sem limite configurado', value: fmt.int(i.unconfiguredCount), tone: attention(num(i.unconfiguredCount)), note: 'commodities sem política ativa', href: '/risco?view=limits' },
    ],
    body: (
      <Grid>
        <Panel span={6} title="Uso de limite por commodity" subtitle="Posição líquida aberta sobre o limite da política" action={{ href: '/risco?view=limits', label: 'Ver limites' }}>
          <MeterList
            empty="Nenhuma posição aberta."
            rows={positions.map((row) => {
              const status = text(row.status);
              const percent = hasValue(row.utilization_pct) ? num(row.utilization_pct) : null;
              return {
                key: text(row.commodity),
                label: commodity(row.commodity),
                sublabel: hasValue(row.max_net_open_kg) ? `${fmt.tonnes(row.net_open_kg)} de ${fmt.tonnes(row.max_net_open_kg)}` : `${fmt.tonnes(row.net_open_kg)} sem limite definido`,
                percent,
                warning: hasValue(row.warning_threshold_pct) ? num(row.warning_threshold_pct) : null,
                tone: status === 'EXCEEDED' ? 'critical' : status === 'WARNING' ? 'warning' : status === 'OK' ? 'ok' : 'none',
                display: percent === null ? 'Sem limite' : fmt.pct(percent),
                tip: `${commodity(row.commodity)}\nPosição líquida: ${fmt.tonnes(row.net_open_kg)}\nLimite: ${hasValue(row.max_net_open_kg) ? fmt.tonnes(row.max_net_open_kg) : 'não configurado'}\nAlerta em ${hasValue(row.warning_threshold_pct) ? fmt.pct(num(row.warning_threshold_pct)) : '—'}`,
              };
            })}
          />
        </Panel>
        <Panel span={6} title="Compra e venda contratadas" subtitle="Volume ativo por commodity" action={{ href: '/risco?view=coverage', label: 'Ver cobertura' }}>
          {positions.length ? (
            <figure className={styles.figure}>
              <ul className={styles.pairList}>
                {positions.map((row) => (
                  <li key={text(row.commodity)} data-tip={`${commodity(row.commodity)}\nCompra: ${fmt.tonnes(row.purchase_kg)}\nVenda: ${fmt.tonnes(row.sales_kg)}`}>
                    <span className={styles.rowLabel}>{commodity(row.commodity)}</span>
                    <span className={styles.pairBars}>
                      <span><i style={{ width: `${Math.max(1, (num(row.purchase_kg) / scale) * 100)}%`, background: palette.primary }} /><b>{fmt.tonnes(row.purchase_kg)}</b></span>
                      <span><i style={{ width: `${Math.max(num(row.sales_kg) > 0 ? 1 : 0, (num(row.sales_kg) / scale) * 100)}%`, background: palette.tertiary }} /><b>{fmt.tonnes(row.sales_kg)}</b></span>
                    </span>
                  </li>
                ))}
              </ul>
              <Legend items={[{ label: 'Compra', color: palette.primary }, { label: 'Venda', color: palette.tertiary }]} />
            </figure>
          ) : <p className={styles.empty}>Nenhuma compra ou venda ativa.</p>}
        </Panel>
        <Panel span={12} title="Exposição por mês de entrega" subtitle="Saldo ainda não entregue de compras e vendas ativas; atrasos entram no mês corrente">
          <Columns
            label="Exposição aberta por mês de entrega"
            empty="Sem saldos a entregar nos próximos seis meses."
            format={(value) => fmt.tonnes(value)}
            height={170}
            categories={exposure.map((row, index) => ({
              key: text(row.month),
              label: dates.monthYear(row.month),
              emphasis: index === 0,
              values: { purchase: num(row.purchase_open_kg), sales: num(row.sales_open_kg) },
              tip: `${dates.monthYear(row.month)}\nCompra a receber: ${fmt.tonnes(row.purchase_open_kg)}\nVenda a entregar: ${fmt.tonnes(row.sales_open_kg)}\nLíquido: ${fmt.tonnes(num(row.purchase_open_kg) - num(row.sales_open_kg))}`,
            }))}
            series={[
              { key: 'purchase', label: 'Compra a receber', color: palette.primary },
              { key: 'sales', label: 'Venda a entregar', color: palette.tertiary, negative: true },
            ]}
          />
        </Panel>
        <Panel span={12} title="Posições por commodity" action={{ href: '/risco', label: 'Abrir exposição' }}>
          {positions.length ? (
            <table className={styles.table}>
              <thead><tr><th>Commodity</th><th>Compra</th><th>Venda</th><th>Posição líquida</th><th>Limite</th><th>Uso</th><th>Situação</th></tr></thead>
              <tbody>
                {positions.map((row) => {
                  const info = statusInfo[text(row.status)] ?? { label: text(row.status), tone: 'neutral' as const };
                  return (
                    <tr key={text(row.commodity)}>
                      <td><strong>{commodity(row.commodity)}</strong></td>
                      <td>{fmt.tonnes(row.purchase_kg)}</td>
                      <td>{fmt.tonnes(row.sales_kg)}</td>
                      <td>{fmt.tonnes(row.net_open_kg)}</td>
                      <td>{hasValue(row.max_net_open_kg) ? fmt.tonnes(row.max_net_open_kg) : '—'}</td>
                      <td>{hasValue(row.utilization_pct) ? fmt.pct(num(row.utilization_pct)) : '—'}</td>
                      <td><Status tone={info.tone}>{info.label}</Status></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <p className={styles.empty}>Nenhuma posição aberta.</p>}
          {unavailable.length ? (
            <Note>Ainda não calculados nesta versão: {unavailable.map((code) => unavailableNames[code] ?? code).join(', ')}.</Note>
          ) : null}
        </Panel>
      </Grid>
    ),
  };
}
