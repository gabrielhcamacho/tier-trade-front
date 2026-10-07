import type { ReactNode } from 'react';

export function ClickableTableRow({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={['clickable-table-row', className].filter(Boolean).join(' ')}
      tabIndex={0}
      aria-label={label}
      data-clickable-row="true"
      data-href={href}
    >
      {children}
    </tr>
  );
}
