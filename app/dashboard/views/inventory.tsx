import { BarList, Columns, SegmentBar, palette } from '../charts';
import { commodity, dates, fmt, list, num, text } from '../format';
import { Grid, Panel } from '../ui';
import styles from '../dashboard.module.css';
import { attention, plural, type ViewInput, type ViewOutput } from './types';

const governance = {
  OWNERSHIP: { title: 'Titularidade', states: [
    ['OWN', 'Própria', 'var(--viz-1)'], ['THIRD_PARTY', 'De terceiros', 'var(--viz-4)'], ['PENDING_DEFINITION', 'A definir', 'var(--state-attention)'],
  ] },
  RISK: { title: 'Risco de preço', states: [
    ['ASSUMED', 'Assumido', 'var(--viz-1)'], ['NOT_ASSUMED', 'Não assumido', 'var(--viz-4)'], ['PENDING_DEFINITION', 'A definir', 'var(--state-attention)'],
  ] },
  CUSTODY: { title: 'Custódia', states: [
    ['IN_STORAGE', 'Armazenado', 'var(--viz-1)'], ['IN_TRANSIT', 'Em trânsito', 'var(--viz-2)'], ['RELEASED', 'Liberado', 'var(--viz-muted)'],
  ] },
} as const;

export function inventoryView({ indicators: i, breakdowns }: ViewInput): ViewOutput {
  const lots = num(i.availableLots) + num(i.blockedLots);
  const movements = list(breakdowns, 'movementsByWeek');
  const byCommodity = list(breakdowns, 'physicalByCommodity');
  const byLocation = list(breakdowns, 'physicalByLocation');
  const lotGovernance = list(breakdowns, 'lotGovernance');
  const count = (dimension: string, status: string) =>
    num(lotGovernance.find((row) => row.dimension === dimension && row.status === status)?.lots);

  return {
    kpis: [
      { key: 'physical', label: 'Estoque físico', value: fmt.tonnes(i.physicalQuantityKg), note: `${plural(lots, 'lote', 'lotes')} em ${plural(num(i.activeLocations), 'local', 'locais')}`, href: '/estoque' },
      { key: 'available', label: 'Lotes disponíveis', value: fmt.int(i.availableLots), note: 'liberados para operação', href: '/estoque?view=lots' },
      { key: 'blocked', label: 'Lotes bloqueados', value: fmt.int(i.blockedLots), tone: attention(num(i.blockedLots)), note: 'em revisão de qualidade', href: '/estoque?view=lots' },
      { key: 'transit', label: 'Transferências em trânsito', value: fmt.int(i.transfersInTransit), note: 'entre locais de armazenagem', href: '/estoque?view=movements' },
      { key: 'ownership', label: 'Titularidade a definir', value: fmt.int(i.ownershipPending), tone: attention(num(i.ownershipPending)), note: 'lotes sem dono definido', href: '/estoque?view=lots' },
      { key: 'risk', label: 'Risco a classificar', value: fmt.int(i.riskClassificationPending), tone: attention(num(i.riskClassificationPending)), note: 'lotes fora da posição de risco', href: '/estoque?view=lots' },
    ],
    body: (
      <Grid>
        <Panel span={7} title="Entradas e saídas" subtitle="Movimentação física por semana, últimas oito semanas" action={{ href: '/estoque?view=movements', label: 'Ver movimentos' }}>
          <Columns
            label="Entradas e saídas por semana"
            empty="Nenhuma movimentação nas últimas oito semanas."
            format={(value) => fmt.tonnes(value)}
            categories={movements.map((row, index) => ({
              key: text(row.week),
              label: dates.numeric(row.week),
              emphasis: index === movements.length - 1,
              values: { inbound: num(row.inbound_kg), outbound: num(row.outbound_kg) },
              tip: `Semana de ${dates.dayMonth(row.week)}\nEntradas: ${fmt.tonnes(row.inbound_kg)}\nSaídas: ${fmt.tonnes(row.outbound_kg)}`,
            }))}
            series={[
              { key: 'inbound', label: 'Entradas', color: palette.primary },
              { key: 'outbound', label: 'Saídas', color: palette.tertiary, negative: true },
            ]}
          />
        </Panel>
        <Panel span={5} title="Estoque por commodity" subtitle="Saldo físico atual" action={{ href: '/estoque', label: 'Ver posição' }}>
          <BarList
            empty="Sem saldo físico em estoque."
            rows={byCommodity.map((row) => ({
              key: text(row.commodity),
              label: commodity(row.commodity),
              sublabel: plural(num(row.lots), 'lote', 'lotes'),
              value: num(row.quantity_kg),
              display: fmt.tonnes(row.quantity_kg),
            }))}
          />
        </Panel>
        <Panel span={5} title="Estoque por local" subtitle="Saldo físico por armazém" action={{ href: '/estoque', label: 'Ver posição' }}>
          <BarList
            empty="Nenhum local ativo com saldo."
            rows={byLocation.map((row) => ({
              key: text(row.id),
              label: text(row.name),
              sublabel: `${text(row.code)} · ${plural(num(row.lots), 'lote', 'lotes')}`,
              value: num(row.quantity_kg),
              display: fmt.tonnes(row.quantity_kg),
              color: palette.quaternary,
            }))}
          />
        </Panel>
        <Panel span={7} title="Governança dos lotes" subtitle="Classificação de titularidade, risco e custódia" action={{ href: '/estoque?view=lots', label: 'Ver lotes' }}>
          <div className={styles.stackRows}>
            {(Object.keys(governance) as Array<keyof typeof governance>).map((dimension) => (
              <SegmentBar
                key={dimension}
                title={governance[dimension].title}
                empty={`${governance[dimension].title}: nenhum lote registrado.`}
                segments={governance[dimension].states.map(([status, label, color]) => ({
                  key: status, label, color, value: count(dimension, status), display: fmt.int(count(dimension, status)),
                }))}
              />
            ))}
          </div>
        </Panel>
      </Grid>
    ),
  };
}

