import { NextResponse } from 'next/server';
import { currentUserContext } from '../../../lib/current-user';
import { csvResponse } from '../../../lib/csv';
import { loadContracts } from '../../../lib/contracts';

export async function GET(request: Request) {
  const { identityHeaders } = await currentUserContext();
  const result = await loadContracts(identityHeaders);
  if (result.error || !result.portfolio) {
    return NextResponse.json({ message: result.error ?? 'Relatório indisponível.' }, { status: 502 });
  }

  const search = new URL(request.url).searchParams;
  const commodity = search.get('commodity');
  const status = search.get('status');
  const items = result.portfolio.items.filter((item) =>
    (!commodity || item.commodity === commodity) && (!status || item.status === status));
  const rows: Array<Array<string | number | null>> = [[
    'Contrato', 'Número externo', 'Contraparte', 'Commodity', 'Unidade', 'Quantidade (sc)',
    'Início da entrega', 'Fim da entrega', 'Preço de compra por sc', 'Custos por sc',
    'Margem projetada por sc', 'Status', 'Versão', 'Cargas', 'Cargas abertas',
    'Cargas recebidas', 'Peso programado (kg)', 'Peso recebido (kg)', 'Saldo disponível (kg)',
    'Obrigações abertas', 'Documentos', 'Garantias', 'Assinaturas pendentes', 'Assinaturas concluídas',
  ]];
  for (const item of items) rows.push([
    item.id, item.external_number, item.counterparty_name, item.commodity, item.unit, item.quantity_sc,
    item.delivery_start, item.delivery_end, item.purchase_price_per_sc, item.total_costs_per_sc,
    item.projected_margin_per_sc, item.status, item.contract_version_number, item.load_count,
    item.open_load_count, item.received_load_count, item.scheduled_weight_kg, item.received_weight_kg,
    item.available_weight_kg, item.pending_obligations, item.document_count, item.guarantee_count,
    item.pending_signature_count, item.signed_signature_count,
  ]);

  return csvResponse(`carteira-contratos-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}
