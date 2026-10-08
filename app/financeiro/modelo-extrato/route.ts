import { csvResponse } from '../../../lib/csv';

export async function GET() {
  return csvResponse(
    'modelo-extrato-tier-trade.csv',
    [
      ['data', 'direcao', 'valor', 'referencia', 'descricao'],
      ['08/10/2026 09:30', 'credito', '12500,00', 'PIX-EXEMPLO-001', 'Recebimento ilustrativo'],
      ['08/10/2026 14:15', 'debito', '3200,50', 'TED-EXEMPLO-002', 'Pagamento ilustrativo'],
    ],
  );
}
