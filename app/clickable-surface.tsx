import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type ClickableSurfaceProps = Omit<ComponentPropsWithoutRef<'article'>, 'children'> & {
  href: string;
  label: string;
  children: ReactNode;
};

export function ClickableSurface({ href, label, children, className, ...props }: ClickableSurfaceProps) {
  return (
    <article
      {...props}
      className={['clickable-surface', className].filter(Boolean).join(' ')}
      role="link"
      tabIndex={0}
      aria-label={label}
      data-clickable-surface="true"
      data-href={href}
    >
      {children}
    </article>
  );
}
