import type { ReactNode } from 'react';
import type { Kpi } from '../ui';

export type ViewInput = {
  indicators: Record<string, unknown>;
  breakdowns: Record<string, unknown>;
  unavailable: string[];
  today: string;
  timezone: string;
};

export type ViewOutput = { kpis: Kpi[]; body: ReactNode };

export const attention = (value: number) => (value > 0 ? 'attention' as const : undefined);
export const critical = (value: number) => (value > 0 ? 'critical' as const : undefined);
export const plural = (count: number, one: string, many: string) => `${count.toLocaleString('pt-BR')} ${count === 1 ? one : many}`;
