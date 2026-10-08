export type ReportFilters = { from: string | null; to: string | null; criterion: string };

export function reportFilters(searchParams: URLSearchParams): ReportFilters {
  const validDate = (value: string | null) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  return {
    from: validDate(searchParams.get('de')),
    to: validDate(searchParams.get('ate')),
    criterion: (searchParams.get('criterio') ?? '').trim().toLocaleLowerCase('pt-BR').slice(0, 120),
  };
}

export function matchesReportFilters(filters: ReportFilters, date: string | null | undefined, values: unknown[]): boolean {
  const day = date?.slice(0, 10) ?? null;
  if (filters.from && (!day || day < filters.from)) return false;
  if (filters.to && (!day || day > filters.to)) return false;
  if (!filters.criterion) return true;
  return values.some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(filters.criterion));
}
