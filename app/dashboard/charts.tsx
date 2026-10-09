import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import styles from './dashboard.module.css';
import { dates, day, diffDays, niceMax } from './format';

// Chart primitives drawn in HTML/CSS so labels stay crisp at any width.
// Palette: categorical slots validated for colour-vision deficiency
// (#0f7550, #86c04d, #b06f1f, #3f73b8); status colours stay reserved.
export const palette = {
  primary: 'var(--viz-1)',
  secondary: 'var(--viz-2)',
  tertiary: 'var(--viz-3)',
  quaternary: 'var(--viz-4)',
  muted: 'var(--viz-muted)',
  track: 'var(--viz-track)',
  attention: 'var(--state-attention)',
  critical: 'var(--state-critical)',
};

type Cell = CSSProperties & Record<`--${string}`, string | number>;

export function Empty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

export function Legend({ items }: { items: Array<{ label: string; color: string; value?: string }> }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.label}>
          <i style={{ background: item.color }} aria-hidden="true" />
          <span>{item.label}</span>
          {item.value ? <b>{item.value}</b> : null}
        </li>
      ))}
    </ul>
  );
}

export type ColumnSeries = { key: string; label: string; color: string; negative?: boolean };
export type ColumnCategory = {
  key: string;
  label: string;
  sublabel?: string;
  values: Record<string, number>;
  tip?: string;
  emphasis?: boolean;
};

/** Vertical columns: stacked, optionally mirrored below the baseline. */
export function Columns({ categories, series, format, empty, height = 184, legend = true, label }: {
  categories: ColumnCategory[];
  series: ColumnSeries[];
  format: (value: number) => string;
  empty: string;
  height?: number;
  legend?: boolean;
  label: string;
}) {
  const up = series.filter((item) => !item.negative);
  const down = series.filter((item) => item.negative);
  const sum = (category: ColumnCategory, group: ColumnSeries[]) =>
    group.reduce((total, item) => total + Math.max(0, category.values[item.key] ?? 0), 0);
  const upMax = Math.max(0, ...categories.map((category) => sum(category, up)));
  const downMax = Math.max(0, ...categories.map((category) => sum(category, down)));
  if (upMax === 0 && downMax === 0) return <Empty>{empty}</Empty>;
  // Counts get even integer bounds so the midline tick is a whole number.
  const counts = categories.every((category) => Object.values(category.values).every((value) => Number.isInteger(value)));
  const bound = (value: number) => (value <= 0 ? 0 : counts ? Math.max(2, Math.ceil(niceMax(value) / 2) * 2) : niceMax(value));
  const top = bound(upMax);
  const bottom = bound(downMax);
  const span = top + bottom;
  const baseline = (top / span) * 100;
  const ticks = [
    ...(top ? [{ value: top, at: 0 }, { value: top / 2, at: (top / 2 / span) * 100 }] : []),
    { value: 0, at: baseline },
    ...(bottom ? [{ value: -bottom / 2, at: baseline + (bottom / 2 / span) * 100 }, { value: -bottom, at: 100 }] : []),
  ];
  return (
    <figure className={styles.figure} aria-label={label}>
      <div className={styles.columns} data-dense={categories.length > 10 || undefined} style={{ '--plot-height': `${height}px` } as Cell}>
        <div className={styles.columnsAxis} aria-hidden="true">
          {ticks.map((tick) => (
            <span key={`${tick.value}-${tick.at}`} style={{ top: `${tick.at}%` }}>{tick.value === 0 ? '0' : format(Math.abs(tick.value))}</span>
          ))}
        </div>
        <div className={styles.columnsPlot}>
          {ticks.map((tick) => (
            <i key={`g${tick.value}-${tick.at}`} className={tick.value === 0 ? styles.baseline : styles.gridline} style={{ top: `${tick.at}%` }} />
          ))}
          <div className={styles.columnsTrack} style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}>
            {categories.map((category) => {
              const upTotal = sum(category, up);
              const downTotal = sum(category, down);
              return (
                <div key={category.key} className={styles.columnSlot} data-emphasis={category.emphasis || undefined} data-tip={category.tip} tabIndex={category.tip ? 0 : undefined}>
                  {upTotal > 0 ? (
                    <div className={styles.stackUp} style={{ bottom: `${100 - baseline}%`, height: `${(upTotal / span) * 100}%` }}>
                      {up.map((item) => {
                        const value = Math.max(0, category.values[item.key] ?? 0);
                        return value > 0 ? <span key={item.key} style={{ flexGrow: value, background: item.color }} /> : null;
                      })}
                    </div>
                  ) : null}
                  {downTotal > 0 ? (
                    <div className={styles.stackDown} style={{ top: `${baseline}%`, height: `${(downTotal / span) * 100}%` }}>
                      {down.map((item) => {
                        const value = Math.max(0, category.values[item.key] ?? 0);
                        return value > 0 ? <span key={item.key} style={{ flexGrow: value, background: item.color }} /> : null;
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.columnsLabels} style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {categories.map((category) => (
            <span key={category.key} data-emphasis={category.emphasis || undefined}>
              {category.label}{category.sublabel ? <small>{category.sublabel}</small> : null}
            </span>
          ))}
        </div>
      </div>
      {legend && series.length > 1 ? <Legend items={series.map((item) => ({ label: item.label, color: item.color }))} /> : null}
    </figure>
  );
}

export type BarRow = {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  display: string;
  tip?: string;
  color?: string;
  href?: string;
};

/** Ranked horizontal bars sharing one scale. */
export function BarList({ rows, empty, max, keepZero = false }: { rows: BarRow[]; empty: string; max?: number; keepZero?: boolean }) {
  if (!rows.some((row) => row.value > 0)) return <Empty>{empty}</Empty>;
  const visible = keepZero ? rows : rows.filter((row) => row.value > 0);
  const scale = max ?? Math.max(...visible.map((row) => row.value));
  return (
    <ul className={styles.barList}>
      {visible.map((row) => {
        const content = (
          <>
            <span className={styles.rowLabel}>{row.label}{row.sublabel ? <small>{row.sublabel}</small> : null}</span>
            <span className={styles.barTrack}>{row.value > 0 ? <i style={{ width: `${Math.max(1.5, (row.value / scale) * 100)}%`, background: row.color ?? palette.primary }} /> : null}</span>
            <b>{row.display}</b>
          </>
        );
        return (
          <li key={row.key} data-tip={row.tip}>
            {row.href ? <Link href={row.href}>{content}</Link> : <div>{content}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export type ProgressRow = {
  key: string;
  label: string;
  sublabel?: string;
  total: number;
  done: number;
  pending?: number;
  display: string;
  detail?: string;
  tip?: string;
  href?: string;
};

/** Executed against committed: a filled share of a full-width track. */
export function ProgressList({ rows, empty, doneLabel, pendingLabel }: {
  rows: ProgressRow[];
  empty: string;
  doneLabel: string;
  pendingLabel?: string;
}) {
  const visible = rows.filter((row) => row.total > 0);
  if (!visible.length) return <Empty>{empty}</Empty>;
  return (
    <figure className={styles.figure}>
      <ul className={styles.progressList}>
        {visible.map((row) => {
          const done = Math.min(100, (row.done / row.total) * 100);
          const pending = Math.min(100 - done, ((row.pending ?? 0) / row.total) * 100);
          const body = (
            <>
              <div className={styles.progressHead}>
                <span className={styles.rowLabel}>{row.label}{row.sublabel ? <small>{row.sublabel}</small> : null}</span>
                <span className={`${styles.progressValue} ${styles.progressInline}`}><b>{row.display}</b>{row.detail ? <small>{row.detail}</small> : null}</span>
              </div>
              <span className={styles.progressTrack}>
                {done > 0 ? <i style={{ width: `${Math.max(done, 0.8)}%` }} /> : null}
                {pending > 0 ? <em style={{ width: `${pending}%` }} /> : null}
              </span>
            </>
          );
          return <li key={row.key} data-tip={row.tip}>{row.href ? <Link href={row.href}>{body}</Link> : <div>{body}</div>}</li>;
        })}
      </ul>
      <Legend items={[
        { label: doneLabel, color: palette.primary },
        ...(pendingLabel ? [{ label: pendingLabel, color: palette.secondary }] : []),
        { label: 'Saldo a executar', color: palette.track },
      ]} />
    </figure>
  );
}

export type Segment = { key: string; label: string; value: number; color: string; display: string };

/** Part-to-whole on a single bar, legend carrying the values. */
export function SegmentBar({ segments, title, empty, legend = true }: {
  segments: Segment[];
  title?: string;
  empty?: string;
  /** `rows` lists every part with its value and share under the bar. */
  legend?: boolean | 'rows';
}) {
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  if (!total) return empty ? <Empty>{empty}</Empty> : null;
  return (
    <div className={styles.segment}>
      {title ? <span className={styles.segmentTitle}>{title}</span> : null}
      <div className={styles.segmentBar}>
        {visible.map((segment) => (
          <i key={segment.key} style={{ flexGrow: segment.value, background: segment.color }}
            data-tip={`${segment.label}\n${segment.display} · ${Math.round((segment.value / total) * 100)}%`} />
        ))}
      </div>
      {legend === 'rows' ? (
        <ul className={styles.segmentRows}>
          {segments.map((segment) => (
            <li key={segment.key}>
              <i style={{ background: segment.color }} aria-hidden="true" />
              <span>{segment.label}</span>
              <b>{segment.display}</b>
              <small>{total ? `${Math.round((segment.value / total) * 100)}%` : '—'}</small>
            </li>
          ))}
        </ul>
      ) : legend ? <Legend items={segments.map((segment) => ({ label: segment.label, color: segment.color, value: segment.display }))} /> : null}
    </div>
  );
}

export type MeterRow = {
  key: string;
  label: string;
  sublabel?: string;
  percent: number | null;
  warning: number | null;
  tone: 'ok' | 'warning' | 'critical' | 'none';
  display: string;
  tip?: string;
};

/** Limit utilisation with the warning threshold and the limit marked. */
export function MeterList({ rows, empty }: { rows: MeterRow[]; empty: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  const domain = Math.max(120, ...rows.map((row) => (row.percent ?? 0) + 10));
  const at = (value: number) => `${(value / domain) * 100}%`;
  return (
    <ul className={styles.meterList}>
      {rows.map((row) => (
        <li key={row.key} data-tip={row.tip}>
          <div className={styles.progressHead}>
            <span className={styles.rowLabel}>{row.label}{row.sublabel ? <small>{row.sublabel}</small> : null}</span>
            <span className={styles.progressValue}><b data-tone={row.tone}>{row.display}</b></span>
          </div>
          <span className={styles.meterTrack}>
            {row.percent !== null ? <i data-tone={row.tone} style={{ width: at(Math.max(row.percent, 0.8)) }} /> : null}
            {row.warning !== null ? <span className={styles.meterMark} style={{ left: at(row.warning) }} data-label={`${Math.round(row.warning)}%`} /> : null}
            {row.percent !== null ? <span className={styles.meterLimit} style={{ left: at(100) }} data-label="limite" /> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type TimelineRow = {
  key: string;
  label: string;
  sublabel?: string;
  start: string;
  end: string;
  progress: number;
  display: string;
  detail?: string;
  tip?: string;
  href?: string;
};

/** Delivery windows on a shared calendar, executed share filled in. */
export function Timeline({ rows, today, empty }: { rows: TimelineRow[]; today: string; empty: string }) {
  const valid = rows.filter((row) => day(row.start) && day(row.end));
  const now = day(today);
  if (!valid.length || !now) return <Empty>{empty}</Empty>;
  const starts = valid.map((row) => day(row.start)!.getTime());
  const ends = valid.map((row) => day(row.end)!.getTime());
  const first = new Date(Math.min(now.getTime(), ...starts));
  const last = new Date(Math.max(now.getTime(), ...ends));
  const from = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
  const to = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1));
  const total = Math.max(1, diffDays(to, from));
  const at = (value: Date) => (diffDays(value, from) / total) * 100;
  const months: Date[] = [];
  for (let cursor = new Date(from); cursor < to; cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))) {
    months.push(cursor);
  }
  const todayAt = at(now);
  return (
    <div className={styles.timeline}>
      <div className={styles.timelineScale} aria-hidden="true">
        <span />
        <div>
          {months.map((month) => (
            <span key={month.toISOString()} style={{ left: `${at(month)}%` }}>{dates.monthYear(month.toISOString().slice(0, 10))}</span>
          ))}
        </div>
        <span />
      </div>
      <ul>
        {valid.map((row) => {
          const start = at(day(row.start)!);
          const end = at(new Date(day(row.end)!.getTime() + 86_400_000));
          const body = (
            <>
              <span className={styles.rowLabel}>{row.label}{row.sublabel ? <small>{row.sublabel}</small> : null}</span>
              <span className={styles.timelineLane}>
                {months.map((month) => <i key={month.toISOString()} className={styles.timelineTick} style={{ left: `${at(month)}%` }} />)}
                <span className={styles.timelineBar} style={{ left: `${start}%`, width: `${Math.max(0.8, end - start)}%` }}>
                  <i style={{ width: `${Math.min(100, row.progress)}%` }} />
                </span>
                <i className={styles.timelineToday} style={{ left: `${todayAt}%` }} />
              </span>
              <span className={styles.progressValue}><b>{row.display}</b>{row.detail ? <small>{row.detail}</small> : null}</span>
            </>
          );
          return <li key={row.key} data-tip={row.tip}>{row.href ? <Link href={row.href}>{body}</Link> : <div>{body}</div>}</li>;
        })}
      </ul>
      <div className={styles.timelineFoot}>
        <Legend items={[{ label: 'Janela de entrega', color: 'var(--viz-window)' }, { label: 'Recebido', color: palette.primary }]} />
        <span><i className={styles.todaySwatch} aria-hidden="true" />Hoje, {dates.dayMonth(today)}</span>
      </div>
    </div>
  );
}
