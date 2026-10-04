'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function CommodityFilter({ selected }: { selected: 'ALL' | 'MILHO' | 'SOJA' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <label><small>Commodity</small><select value={selected} disabled={pending} aria-label="Filtrar por commodity" onChange={(event) => {
    const value = event.currentTarget.value;
    startTransition(() => router.push(value === 'ALL' ? '/central' : `/central?commodity=${value}`));
  }}><option value="ALL">Todas</option><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select><span className="overview-filter-progress" aria-live="polite">{pending ? 'Atualizando…' : ''}</span></label>;
}
