'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => { setPending(false); }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.hasAttribute('download') || anchor.target === '_blank') return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
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

  return <div className="navigation-progress" data-pending={pending ? 'true' : undefined} role="status" aria-live="polite"><span className="navigation-progress-bar" /><span className="navigation-progress-message" aria-hidden={!pending}><i aria-hidden="true" />{pending ? 'Abrindo página…' : ''}</span></div>;
}
