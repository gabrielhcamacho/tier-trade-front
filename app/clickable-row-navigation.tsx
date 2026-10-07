'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, summary, [role="button"], [role="link"]';

function rowFrom(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLTableRowElement>('tr[data-clickable-row="true"][data-href]') : null;
}

function isNestedControl(target: EventTarget | null, row: HTMLTableRowElement) {
  return target instanceof Element && target !== row && Boolean(target.closest(INTERACTIVE_SELECTOR));
}

export function ClickableRowNavigation() {
  const router = useRouter();
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    function preload(target: EventTarget | null) {
      const row = rowFrom(target);
      const href = row?.dataset.href;
      if (!href || prefetched.current.has(href)) return;
      prefetched.current.add(href);
      router.prefetch(href);
    }

    function navigate(target: EventTarget | null) {
      const row = rowFrom(target);
      const href = row?.dataset.href;
      if (!row || !href || isNestedControl(target, row)) return;
      router.push(href);
    }

    function onClick(event: MouseEvent) {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) navigate(event.target);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const row = rowFrom(event.target);
      if (!row || isNestedControl(event.target, row)) return;
      event.preventDefault();
      navigate(event.target);
    }

    function onPointerOver(event: PointerEvent) { preload(event.target); }
    function onFocusIn(event: FocusEvent) { preload(event.target); }

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [router]);

  return null;
}
