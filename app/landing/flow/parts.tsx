'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Sparkle } from './icons';

/* recortes sem a margem transparente dos arquivos originais (brandAssets.wordmarkOnLight/OnDark) */
export const LOGO = {
  onLight: '/images/tier-trade-wordmark-on-light.png',
  onDark: '/images/tier-trade-wordmark-on-dark.png',
};

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <span className="fl-logo">
      <img src={tone === 'light' ? LOGO.onDark : LOGO.onLight} alt="Tier Trade" className={tone === 'light' ? 'is-dark' : 'is-light'} />
    </span>
  );
}

export function Cursor({ label, color = '#2f7a3e', className = '', style }: { label?: string; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`ui-cursor ${className}`} style={style} aria-hidden="true">
      <svg width="18" height="20" viewBox="0 0 18 20">
        <path d="M1.5 1.5 16 9.2l-6.6 1.7-3.1 6.6z" fill={color} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      {label && <span style={{ background: color }}>{label}</span>}
    </div>
  );
}

/** Selo da IA: sempre perto de uma confirmação, nunca sozinho. */
export function Ai({ children, dark, style }: { children: ReactNode; dark?: boolean; style?: CSSProperties }) {
  return (
    <span className={`ui-ai ${dark ? 'ui-ai--dark' : ''}`} style={style}>
      <Sparkle size={11} />
      {children}
    </span>
  );
}

export function Tile({ children, bg, color = '#fff', size }: { children: ReactNode; bg?: string; color?: string; size?: number }) {
  return (
    <span className="ui-tile" style={{ background: bg, color, boxShadow: bg ? 'none' : undefined, width: size, height: size }}>
      {children}
    </span>
  );
}

/**
 * Renderiza o filho na largura de desenho e escala para caber (telas de produto no mobile).
 * Com `minScale`, não encolhe abaixo disso: o excedente sangra para as laterais, centralizado.
 */
export function ScaleBox({ width, minScale = 0, children }: { width: number; minScale?: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ s: 1, h: 0, x: 0 });
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const s = Math.max(minScale, Math.min(1, o.clientWidth / width));
      setBox({ s, h: i.offsetHeight * s, x: Math.min(0, (o.clientWidth - width * s) / 2) });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    measure();
    return () => ro.disconnect();
  }, [width, minScale]);
  return (
    <div ref={outer} className="fl-bleed" style={{ height: box.h || undefined, overflowX: 'clip' }}>
      <div ref={inner} style={{ width, transform: `translateX(${box.x}px) scale(${box.s})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </div>
  );
}

/** Rola até uma seção da própria página (o header é fixo, então desconta a altura dele). */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  history.replaceState(null, '', `#${id}`);
}
