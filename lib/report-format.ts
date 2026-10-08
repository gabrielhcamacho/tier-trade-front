import type { ReportDomain } from './report-explorer';

const statuses: Record<string, string> = {
  READY: 'Pronto', OPEN: 'Em aberto', RECEIVED: 'Recebido', VALIDATED: 'Validado', REJECTED: 'Rejeitado',
  AVAILABLE: 'Disponível', MATCHED: 'Conciliado', UNMATCHED: 'Não conciliado',
  ACCEPTED: 'Aceito', REVIEW_REQUIRED: 'Em revisão', CONFIRMED: 'Confirmado',
  PARTIALLY_SETTLED: 'Liquidado parcialmente', SETTLED: 'Liquidado',
  CALCULATED: 'Calculado', CANCELLED: 'Cancelado',
};

function decimal(input: string, minimumFractionDigits = 0): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(input);
  if (!match) return input;
  const grouped = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fraction = (match[3] ?? '').padEnd(minimumFractionDigits, '0');
  return `${match[1]}${grouped}${fraction ? `,${fraction}` : ''}`;
}

export function reportStatus(input: string): string { return statuses[input] ?? input; }

export function reportDate(input: string | null): string {
  if (!input) return '—';
  if (input.includes('T')) {
    const parsed = new Date(input);
    if (!Number.isNaN(parsed.valueOf())) return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(parsed);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : input;
}

export function reportValue(domain: ReportDomain, input: string): string {
  if (domain === 'financeiro' || domain === 'fiscal') return /^-?\d+(?:\.\d+)?$/.test(input) ? `R$ ${decimal(input, 2)}` : input;
  return input.replace(/^(-?\d+(?:\.\d+)?) kg(.*)$/, (_, quantity: string, suffix: string) => `${decimal(quantity)} kg${suffix}`);
}

export function reportField(label: string, input: string): string {
  if (input === '—') return input;
  if (/^(Data|Vencimento|Previsão|Competência|Programação|Ocorrido em|Registrado em|Estornado em|Resolvido em)/i.test(label)) return reportDate(input);
  if (/^(Valor|Preço|Saldo|Pago|Bruto|Líquido|Tributos|Retidos|Ajustes|Liquidado|Diferença)/i.test(label) && /^-?\d+(?:\.\d+)?$/.test(input)) return `R$ ${decimal(input, 2)}`;
  if (/(kg|%)$/i.test(label) && /^-?\d+(?:\.\d+)?$/.test(input)) return decimal(input);
  return reportStatus(input);
}
