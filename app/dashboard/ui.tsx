import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import styles from './dashboard.module.css';

export type Kpi = {
  key: string;
  label: string;
  value: string;
  note?: ReactNode;
  href?: string;
  /** Only set when the figure itself asks for action. */
  tone?: 'attention' | 'critical';
  /** Optional 0–100 share drawn under the value. */
  progress?: number;
  tip?: string;
};

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <section className={styles.kpis} aria-label="Indicadores" style={{ '--kpi-count': items.length } as CSSProperties}>
      {items.map((item) => {
        const body = (
          <>
            <span className={styles.kpiLabel}>{item.label}</span>
            <strong className={styles.kpiValue} data-tone={item.tone}>{item.value}</strong>
            {item.progress !== undefined ? (
              <span className={styles.kpiProgress} aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(item.progress, item.progress > 0 ? 1.5 : 0))}%` }} /></span>
            ) : null}
            {item.note ? <span className={styles.kpiNote}>{item.note}</span> : null}
          </>
        );
        return item.href
          ? <Link key={item.key} href={item.href} className={styles.kpi} data-tip={item.tip}>{body}</Link>
          : <div key={item.key} className={styles.kpi} data-tip={item.tip}>{body}</div>;
      })}
    </section>
  );
}

export function Panel({ title, subtitle, action, span = 6, children }: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel} data-span={span}>
      <header className={styles.panelHead}>
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <Link href={action.href}>{action.label}</Link> : null}
      </header>
      {children}
    </section>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

/** Compact rows of records: primary text, secondary line and a trailing figure. */
export function RecordList({ rows, empty }: {
  rows: Array<{ key: string; title: string; meta?: string; value?: string; side?: string; href?: string; tone?: 'attention' | 'critical' }>;
  empty: string;
}) {
  if (!rows.length) return <p className={styles.empty}>{empty}</p>;
  return (
    <ul className={styles.records}>
      {rows.map((row) => {
        const body = (
          <>
            <span className={styles.recordMain}>
              <strong>{row.title}</strong>
              {row.meta ? <small>{row.meta}</small> : null}
            </span>
            <span className={styles.recordSide}>
              {row.value ? <b data-tone={row.tone}>{row.value}</b> : null}
              {row.side ? <small>{row.side}</small> : null}
            </span>
          </>
        );
        return <li key={row.key}>{row.href ? <Link href={row.href}>{body}</Link> : <div>{body}</div>}</li>;
      })}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
