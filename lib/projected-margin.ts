import type { ContractListItem } from './contracts';

const SCALE = BigInt(1_000_000);
const SUBCENT = BigInt(10_000_000_000);

function decimalSix(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) throw new Error('Valor decimal inválido no contrato.');
  const scaled = BigInt(match[2]) * SCALE + BigInt((match[3] ?? '').padEnd(6, '0') || '0');
  return match[1] === '-' ? -scaled : scaled;
}

// Contract margin comes from the API. Only aggregate when the result has exact cents;
// otherwise a tenant rounding policy is required before presenting a monetary total.
export function projectedMarginExact(items: ContractListItem[]): string | null {
  const total = items.reduce((sum, item) =>
    sum + decimalSix(item.quantity_sc) * decimalSix(item.projected_margin_per_sc), BigInt(0));
  if (total % SUBCENT !== BigInt(0)) return null;
  const cents = total / SUBCENT;
  const negative = cents < BigInt(0);
  const absolute = negative ? -cents : cents;
  const reais = absolute / BigInt(100);
  const centavos = String(absolute % BigInt(100)).padStart(2, '0');
  return `${negative ? '-' : ''}R$ ${String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${centavos}`;
}
