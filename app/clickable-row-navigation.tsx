'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, summary, [role="button"], [role="link"]';

function targetFrom(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>('[data-clickable-surface="true"][data-href], tr[data-clickable-row="true"][data-href]')
    : null;
}

function isNestedControl(target: EventTarget | null, surface: HTMLElement) {
  if (!(target instanceof Element) || target === surface) return false;
  const control = target.closest(INTERACTIVE_SELECTOR);
  return Boolean(control && control !== surface);
}

export function ClickableRowNavigation() {
  const router = useRouter();
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    function preload(target: EventTarget | null) {
      const surface = targetFrom(target);
      const href = surface?.dataset.href;
      if (!href || prefetched.current.has(href)) return;
      prefetched.current.add(href);
      router.prefetch(href);
    }

    function navigate(target: EventTarget | null) {
      const surface = targetFrom(target);
      const href = surface?.dataset.href;
      if (!surface || !href || isNestedControl(target, surface)) return;
      const destination = new URL(href, window.location.href);
      // A row opening another page starts at its header. In-page report rows still
      // keep their anchor, since they reveal a detail in the current page.
      if (destination.pathname !== window.location.pathname) destination.hash = '';
      router.push(`${destination.pathname}${destination.search}${destination.hash}`, { scroll: true });
    }

    function onClick(event: MouseEvent) {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) navigate(event.target);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const surface = targetFrom(event.target);
      if (!surface || isNestedControl(event.target, surface)) return;
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
