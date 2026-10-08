'use client';

import { useEffect, useRef, useState, type RefObject } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** true enquanto o elemento está (parcialmente) visível. */
export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.2 }) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView] as const;
}

/** Contador que avança a cada `ms` enquanto `active` (mockups só animam quando visíveis). */
export function useTicker(ms: number, active: boolean) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active || prefersReducedMotion()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
  return tick;
}

/**
 * Marca [data-reveal] com .is-in quando entram na tela (uma vez).
 * Também acompanha elementos que aparecem depois da montagem (ex.: os cards de preço, que
 * só existem quando a API responde) — sem isso eles ficariam invisíveis para sempre.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const SELECTOR = "[data-reveal], .fl-bento";
    const reduced = prefersReducedMotion();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in", "is-drawn");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    const track = (scope: ParentNode) => {
      const found: HTMLElement[] = [];
      if (scope instanceof HTMLElement && scope.matches(SELECTOR)) found.push(scope);
      scope.querySelectorAll<HTMLElement>(SELECTOR).forEach((i) => found.push(i));
      found.forEach((i) => {
        if (i.classList.contains("is-in")) return;
        if (reduced) i.classList.add("is-in", "is-drawn");
        else io.observe(i);
      });
    };
    track(el);
    const mo = new MutationObserver((records) =>
      records.forEach((r) => r.addedNodes.forEach((n) => n instanceof HTMLElement && track(n))),
    );
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [root]);
}

/** Escreve --p (-1..1) no elemento conforme ele atravessa a tela; as camadas usam isso para o parallax. */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
        el.style.setProperty("--p", p.toFixed(3));
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}
