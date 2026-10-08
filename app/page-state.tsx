import Link from 'next/link';

type StateAction = {
  href: string;
  label: string;
};

export function PageFeedback({
  title,
  message,
  action,
  tone = 'critical',
}: {
  title: string;
  message?: string | null;
  action?: StateAction;
  tone?: 'critical' | 'positive' | 'info';
}) {
  const isCritical = tone === 'critical';
  return (
    <section className={`page-feedback ${tone}`} role={isCritical ? 'alert' : 'status'} aria-live={isCritical ? 'assertive' : 'polite'}>
      <span className="page-feedback-mark" aria-hidden="true">{isCritical ? '!' : tone === 'positive' ? '✓' : 'i'}</span>
      <div><strong>{title}</strong>{message ? <p>{message}</p> : null}</div>
      {action ? <Link href={action.href}>{action.label}<span aria-hidden="true">→</span></Link> : null}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
  eyebrow = 'SEM REGISTROS',
  compact = false,
}: {
  title: string;
  description: string;
  action?: StateAction;
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <section className="page-empty-state" data-compact={compact || undefined} aria-label={title}>
      <span className="page-empty-mark" aria-hidden="true">—</span>
      <div><p>{eyebrow}</p><h2>{title}</h2><span>{description}</span></div>
      {action ? <Link href={action.href}>{action.label}<span aria-hidden="true">→</span></Link> : null}
    </section>
  );
}
