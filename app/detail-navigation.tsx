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
        <span aria-hidden="true">←</span><span>{backLabel}</span>
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
