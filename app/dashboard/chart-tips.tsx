'use client';

import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import styles from './dashboard.module.css';

type Tip = { lines: string[]; x: number; y: number };

// One delegated listener per overview: any mark with `data-tip` shows its
// value on hover or keyboard focus. Values stay readable without it.
export function ChartTips({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const frame = useRef(0);

  const show = useCallback((target: EventTarget | null, x: number, y: number) => {
    const mark = target instanceof Element ? target.closest<HTMLElement>('[data-tip]') : null;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setTip(mark?.dataset.tip ? { lines: mark.dataset.tip.split('\n'), x, y } : null);
    });
  }, []);

  return (
    <div
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => show(event.target, event.clientX, event.clientY)}
      onPointerLeave={() => setTip(null)}
      onFocus={(event) => {
        const rect = (event.target as Element).getBoundingClientRect();
        show(event.target, rect.left + rect.width / 2, rect.top);
      }}
      onBlur={() => setTip(null)}
    >
      {children}
      {tip ? (
        <div
          className={styles.tooltip}
          role="status"
          style={{
            left: Math.min(tip.x + 14, (typeof window === 'undefined' ? 1200 : window.innerWidth) - 240),
            top: tip.y + 16,
          }}
        >
          <strong>{tip.lines[0]}</strong>
          {tip.lines.slice(1).map((line) => <span key={line}>{line}</span>)}
        </div>
      ) : null}
    </div>
  );
}
