import Link from 'next/link';

export type DetailCrumb = {
  label: string;
  href?: string;
  mono?: boolean;
};

export function DetailNavigation({
  backHref,
  backLabel = 'Voltar',
  items,
}: {
  backHref: string;
  backLabel?: string;
  items: DetailCrumb[];
}) {
  return (
    <div className="detail-navigation">
      <Link className="detail-back-link" href={backHref} aria-label={backLabel}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 5.5-6.5 6.5 6.5 6.5" /></svg>
      </Link>
      <nav aria-label="Navegação estrutural">
        <ol className="detail-breadcrumbs">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className={item.mono ? 'tt-mono' : undefined}>
              {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
