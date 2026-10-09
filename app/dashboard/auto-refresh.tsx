'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DashboardResponse } from '../../lib/dashboard';

const MAX_ATTEMPTS = 6;

/** A snapshot can be queued after the first render. Re-read the server page
 * until the worker publishes it, without making the user press Atualizar. */
export function DashboardAutoRefresh({ freshness }: { freshness: DashboardResponse['freshness'] }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (freshness === 'FRESH') {
      if (attempt !== 0) setAttempt(0);
      return;
    }
    if (attempt >= MAX_ATTEMPTS) return;

    const timer = window.setTimeout(() => {
      setAttempt((current) => current + 1);
      router.refresh();
    }, Math.min(2500 + attempt * 1500, 7000));
    return () => window.clearTimeout(timer);
  }, [attempt, freshness, router]);

  return null;
}
