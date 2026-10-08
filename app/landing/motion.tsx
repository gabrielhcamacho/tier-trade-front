'use client';

import { useEffect } from 'react';

export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector('[data-header]')?.parentElement;
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    targets.forEach((el) => observer.observe(el));

    const header = root.querySelector<HTMLElement>('[data-header]');
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (header) {
          header.dataset.scrolled = String(window.scrollY > 12);
          const darkSection = root.querySelector<HTMLElement>('main [data-theme="dark"]');
          const bounds = darkSection?.getBoundingClientRect();
          header.dataset.theme = bounds && bounds.top <= 74 && bounds.bottom > 74 ? 'dark' : 'light';
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
