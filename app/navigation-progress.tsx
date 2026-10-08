'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function NavigationProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [pending, setPending] = useState(false);

  useEffect(() => { setPending(false); }, [pathname, query]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.hasAttribute('download') || anchor.target === '_blank') return;
      const destination = new URL(anchor.href, window.location.href);
      const sameRoute = destination.pathname === window.location.pathname && destination.search === window.location.search;
      if (destination.origin !== window.location.origin || sameRoute) return;
      setPending(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPending(false), 12000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  return <div className="navigation-progress" data-pending={pending ? 'true' : undefined} role="progressbar" aria-label="Carregando conteúdo" aria-hidden={!pending}><span className="navigation-progress-bar" /></div>;
}

export function NavigationProgress() {
  return <Suspense fallback={<div className="navigation-progress" aria-hidden="true" />}><NavigationProgressContent /></Suspense>;
}
