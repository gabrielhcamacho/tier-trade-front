// Formatting helpers for the module overviews. Values arrive from the API as
// numeric strings (exact decimals) and are only rounded here, for display.

export type Row = Record<string, unknown>;

export function num(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

export function text(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function list(source: Record<string, unknown> | undefined, key: string): Row[] {
  const value = source?.[key];
  return Array.isArray(value) ? value.filter((item): item is Row => typeof item === 'object' && item !== null) : [];
}

export function record(source: Record<string, unknown> | undefined, key: string): Row | null {
  const value = source?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : null;
}

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const fmt = {
  int: (value: unknown) => integer.format(num(value)),
  pct: (value: number) => `${oneDecimal.format(value)}%`,
  money: (value: unknown) => money.format(num(value)),
  /** R$ 268,1 mil · R$ 1,95 mi — for headline figures and axis labels. */
  moneyShort(value: unknown) {
    const amount = num(value);
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '−' : '';
    if (abs >= 1e9) return `${sign}R$ ${oneDecimal.format(abs / 1e9)} bi`;
    if (abs >= 1e6) return `${sign}R$ ${twoDecimals.format(abs / 1e6).replace(/,?0+$/, '')} mi`;
    if (abs >= 1e3) return `${sign}R$ ${oneDecimal.format(abs / 1e3)} mil`;
    return `${sign}${money.format(abs)}`;
  },
  perSc: (value: unknown) => `R$ ${twoDecimals.format(num(value))}/sc`,
  /** Weight in tonnes; kilograms below one tonne. */
  tonnes(kg: unknown) {
    const value = num(kg);
    if (value !== 0 && Math.abs(value) < 1000) return `${integer.format(value)} kg`;
    const t = value / 1000;
    return `${Math.abs(t) >= 100 ? integer.format(t) : oneDecimal.format(t)} t`;
  },
  sacks: (value: unknown) => `${integer.format(num(value))} sc`,
};

const monthShort = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const weekdayShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Parses YYYY-MM-DD as a calendar date (no timezone shift). */
export function day(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
}

export function diffDays(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export const dates = {
  dayMonth(value: unknown) {
    const date = day(value);
    return date ? `${date.getUTCDate()} ${monthShort[date.getUTCMonth()]}` : '—';
  },
  numeric(value: unknown) {
    const date = day(value);
    return date ? `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}` : '—';
  },
  month(value: unknown) {
    const date = day(value);
    return date ? monthShort[date.getUTCMonth()]! : '—';
  },
  monthYear(value: unknown) {
    const date = day(value);
    return date ? `${monthShort[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(2)}` : '—';
  },
  weekday(value: unknown) {
    const date = day(value);
    return date ? weekdayShort[date.getUTCDay()]! : '';
  },
  /** "vence hoje", "em 4 dias", "há 2 dias" relative to the tenant's today. */
  relative(value: unknown, today: string) {
    const target = day(value);
    const base = day(today);
    if (!target || !base) return 'sem prazo';
    const delta = diffDays(target, base);
    if (delta === 0) return 'hoje';
    if (delta === 1) return 'amanhã';
    if (delta === -1) return 'ontem';
    return delta > 0 ? `em ${delta} dias` : `há ${-delta} dias`;
  },
};

/** Local time for ISO timestamps, in the tenant's timezone. */
export function clockTime(iso: unknown, timezone: string) {
  if (typeof iso !== 'string') return null;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return null;
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { date: `${get('day')}/${get('month')}`, time: `${get('hour')}:${get('minute')}` };
}

const commodityNames: Record<string, string> = {
  MILHO: 'Milho', SOJA: 'Soja', TRIGO: 'Trigo', SORGO: 'Sorgo', CAFE: 'Café', ALGODAO: 'Algodão',
};
export function commodity(value: unknown) {
  const key = text(value, '');
  return commodityNames[key] ?? (key ? key.charAt(0) + key.slice(1).toLowerCase() : 'Outros');
}

/** Removes the demo marker from fictitious names so rows stay readable. */
export function party(value: unknown) {
  return text(value, 'Sem contraparte').replace(/\s+[—-]\s+Dado fictício$/i, '');
}

export function ratio(part: number, whole: number) {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/** A clean upper bound for an axis, close above the largest value. */
export function niceMax(value: number) {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}
