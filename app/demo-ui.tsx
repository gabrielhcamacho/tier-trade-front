import type { ReactNode } from 'react';

export function DemoPageHeader({
  domain,
  section,
  eyebrow,
  title,
  description,
  scope = 'Mountier Agro · Unidade Rio Verde',
}: {
  domain: string;
  section: string;
  eyebrow: string;
  title: string;
  description: string;
  scope?: string;
}) {
  return (
    <header className="page-header">
      <p className="breadcrumbs">{domain} <span>›</span> {section}</p>
      <div className="page-header-row">
        <div><p className="entity-kind">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>
        <span className="environment-label">{scope}</span>
      </div>
    </header>
  );
}

export function DemoMetricStrip({ items }: { items: Array<{ label: string; value: string; unit?: string; detail: string; tone?: 'primary' | 'attention' }> }) {
  return (
    <section className="central-metrics" aria-label="Indicadores">
      {items.map((item) => (
        <article key={item.label} data-primary={item.tone === 'primary' ? 'true' : undefined} data-tone={item.tone === 'attention' ? 'attention' : undefined}>
          <span>{item.label}</span><strong>{item.value}{item.unit ? <em> {item.unit}</em> : null}</strong><small>{item.detail}</small>
        </article>
      ))}
    </section>
  );
}

export function DemoStatus({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'info' | 'attention' | 'positive' | 'critical' }) {
  return <span className="demo-status" data-tone={tone}>{children}</span>;
}

export function DemoSection({ kicker, title, aside, id, children }: { kicker: string; title: string; aside?: string; id?: string; children: ReactNode }) {
  return (
    <section className="detail-section demo-section" id={id}>
      <header><div><p className="section-kicker">{kicker}</p><h2>{title}</h2></div>{aside ? <span className="data-source">{aside}</span> : null}</header>
      {children}
    </section>
  );
}

export function DemoTable({
  label,
  columns,
  rows,
}: {
  label: string;
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="demo-table-wrap">
      <table className="demo-table" aria-label={label}>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
