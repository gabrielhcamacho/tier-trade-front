import { Columns, Empty, Legend, SegmentBar, palette } from '../charts';
import { clockTime, commodity, dates, fmt, hasValue, list, num, party, record, text } from '../format';
import { Grid, Panel, RecordList } from '../ui';
import styles from '../dashboard.module.css';
import { attention, critical, plural, type ViewInput, type ViewOutput } from './types';

const categoryNames: Record<string, string> = {
  DOCUMENT: 'Documentação', WEIGHT: 'Pesagem', QUALITY: 'Qualidade', VEHICLE: 'Veículo', YARD: 'Pátio', OTHER: 'Outras',
};

export function operationsView({ indicators: i, breakdowns, today, timezone }: ViewInput): ViewOutput {
  const critOcc = num(i.criticalOccurrences);
  const byDay = list(breakdowns, 'loadsByDay');
  const weekly = list(breakdowns, 'receivedByWeek');
  const quality = record(breakdowns, 'qualityLast30Days');
  const occurrences = list(breakdowns, 'occurrencesByCategory');
  const upcoming = list(breakdowns, 'upcomingLoads');
  const metrics = quality ? [
    { key: 'moisture', label: 'Umidade', avg: quality.moisture_avg, max: quality.moisture_max },
    { key: 'impurity', label: 'Impureza', avg: quality.impurity_avg, max: quality.impurity_max },
    { key: 'damaged', label: 'Avariados', avg: quality.damaged_avg, max: quality.damaged_max },
  ] : [];
  const metricScale = Math.max(1, ...metrics.map((metric) => num(metric.max)));

  return {
    kpis: [
      { key: 'today', label: 'Cargas para hoje', value: fmt.int(i.loadsToday), note: `${plural(num(i.scheduledLoads), 'carga programada', 'cargas programadas')} no total`, href: '/cargas' },
      { key: 'receiving', label: 'Em recebimento', value: fmt.int(i.loadsInReceiving), note: 'cargas em processamento', href: '/recebimentos' },
      { key: 'received', label: 'Recebido em 30 dias', value: fmt.tonnes(i.receivedLast_30DaysKg ?? i.receivedWeightKg), note: `${plural(num(i.receivedLoads), 'carga recebida', 'cargas recebidas')} no total`, href: '/recebimentos' },
      { key: 'delayed', label: 'Cargas atrasadas', value: fmt.int(i.delayedLoads), tone: attention(num(i.delayedLoads)), note: 'horário programado já passou', href: '/cargas' },
      { key: 'occurrences', label: 'Ocorrências abertas', value: fmt.int(i.openOccurrences), tone: critical(critOcc) ?? attention(num(i.openOccurrences)), note: critOcc ? plural(critOcc, 'crítica', 'críticas') : 'nenhuma crítica', href: '/ocorrencias' },
      { key: 'quality', label: 'Revisões de qualidade', value: fmt.int(i.qualityReviews), tone: attention(num(i.qualityReviews)), note: 'aguardando decisão', href: '/qualidade' },
    ],
    body: (
      <Grid>
        <Panel span={8} title="Agenda de cargas" subtitle="Cargas por dia programado, da semana passada às próximas duas semanas" action={{ href: '/cargas', label: 'Abrir agenda' }}>
          <Columns
            label="Cargas por dia"
            empty="Nenhuma carga programada neste período."
            format={(value) => fmt.int(value)}
            categories={byDay.map((row) => ({
              key: text(row.day),
              label: dates.numeric(row.day),
              sublabel: row.day === today ? 'hoje' : dates.weekday(row.day),
              emphasis: row.day === today,
              values: { received: num(row.received), receiving: num(row.receiving), scheduled: num(row.scheduled), delayed: num(row.delayed) },
              tip: `${dates.weekday(row.day)}, ${dates.dayMonth(row.day)}\nRecebidas: ${fmt.int(row.received)}\nEm recebimento: ${fmt.int(row.receiving)}\nProgramadas: ${fmt.int(row.scheduled)}\nAtrasadas: ${fmt.int(row.delayed)}`,
            }))}
            series={[
              { key: 'received', label: 'Recebidas', color: palette.primary },
              { key: 'receiving', label: 'Em recebimento', color: palette.secondary },
              { key: 'scheduled', label: 'Programadas', color: palette.quaternary },
              { key: 'delayed', label: 'Atrasadas', color: palette.attention },
            ]}
          />
        </Panel>
        <Panel span={4} title="Próximas cargas" subtitle="Em recebimento e programadas" action={{ href: '/cargas', label: 'Ver todas' }}>
          <RecordList
            empty="Nenhuma carga programada."
            rows={upcoming.map((row) => {
              const at = clockTime(row.scheduled_at, timezone);
              return {
                key: text(row.id),
                title: `${text(row.vehicle_plate)} · ${party(row.carrier_name)}`,
                meta: `${party(row.counterparty)} · ${commodity(row.commodity)} · ${fmt.tonnes(row.expected_weight_kg)}`,
                value: row.status === 'IN_RECEIVING' ? 'No pátio' : at ? `${at.date} ${at.time}` : '—',
                side: row.status === 'IN_RECEIVING' ? 'em recebimento' : row.delayed ? 'atrasada' : undefined,
                tone: row.delayed && row.status !== 'IN_RECEIVING' ? 'attention' as const : undefined,
                href: `/cargas/${text(row.id)}`,
              };
            })}
          />
        </Panel>
        <Panel span={5} title="Volume recebido" subtitle="Peso líquido por semana de recebimento" action={{ href: '/recebimentos', label: 'Recebimentos' }}>
          <Columns
            label="Volume recebido por semana"
            empty="Nenhum recebimento nas últimas oito semanas."
            format={(value) => fmt.tonnes(value)}
            height={160}
            categories={weekly.map((row, index) => ({
              key: text(row.week),
              label: dates.numeric(row.week),
              emphasis: index === weekly.length - 1,
              values: { kg: num(row.net_weight_kg) },
              tip: `Semana de ${dates.dayMonth(row.week)}\n${fmt.tonnes(row.net_weight_kg)} em ${plural(num(row.receipts), 'recebimento', 'recebimentos')}`,
            }))}
            series={[{ key: 'kg', label: 'Peso líquido', color: palette.primary }]}
          />
        </Panel>
        <Panel span={4} title="Qualidade nos últimos 30 dias" subtitle="Média e máximo por recebimento" action={{ href: '/qualidade', label: 'Qualidade' }}>
          {quality && num(quality.receipts) > 0 ? (
            <div className={styles.stackRows}>
              <ul className={styles.metricList}>
                {metrics.map((metric) => (
                  <li key={metric.key} data-tip={`${metric.label}\nMédia ${hasValue(metric.avg) ? fmt.pct(num(metric.avg)) : '—'} · máximo ${hasValue(metric.max) ? fmt.pct(num(metric.max)) : '—'}`}>
                    <span>{metric.label}</span>
                    <span className={styles.metricRange}>
                      <i style={{ width: `${(num(metric.max) / metricScale) * 100}%` }} />
                      <b style={{ left: `${(num(metric.avg) / metricScale) * 100}%` }} />
                    </span>
                    <strong>{hasValue(metric.avg) ? fmt.pct(num(metric.avg)) : '—'}<small>máx. {hasValue(metric.max) ? fmt.pct(num(metric.max)) : '—'}</small></strong>
                  </li>
                ))}
              </ul>
              <SegmentBar
                title={`${plural(num(quality.receipts), 'recebimento', 'recebimentos')}`}
                segments={[
                  { key: 'accepted', label: 'Aceitos', value: num(quality.accepted), color: palette.primary, display: fmt.int(quality.accepted) },
                  { key: 'review', label: 'Em revisão', value: num(quality.review_required), color: palette.attention, display: fmt.int(quality.review_required) },
                ]}
              />
            </div>
          ) : <Empty>Nenhum recebimento nos últimos 30 dias.</Empty>}
        </Panel>
        <Panel span={3} title="Ocorrências abertas" subtitle="Por categoria e gravidade" action={{ href: '/ocorrencias', label: 'Ver' }}>
          {occurrences.length ? (
            <div className={styles.stackRows}>
              {occurrences.map((row) => (
                <SegmentBar
                  key={text(row.category)}
                  title={`${categoryNames[text(row.category)] ?? text(row.category)} · ${fmt.int(num(row.critical) + num(row.warning) + num(row.info))}`}
                  legend={false}
                  segments={[
                    { key: 'critical', label: 'Crítica', value: num(row.critical), color: palette.critical, display: fmt.int(row.critical) },
                    { key: 'warning', label: 'Atenção', value: num(row.warning), color: 'var(--viz-warning)', display: fmt.int(row.warning) },
                    { key: 'info', label: 'Informativa', value: num(row.info), color: palette.muted, display: fmt.int(row.info) },
                  ]}
                />
              ))}
              <Legend items={[
                { label: 'Crítica', color: palette.critical },
                { label: 'Atenção', color: 'var(--viz-warning)' },
                { label: 'Informativa', color: palette.muted },
              ]} />
            </div>
          ) : <Empty>Nenhuma ocorrência aberta.</Empty>}
        </Panel>
      </Grid>
    ),
  };
}
