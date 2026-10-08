import { NextRequest, NextResponse } from 'next/server';
import { currentUserContext } from '../../../lib/current-user';
import { csvResponse } from '../../../lib/csv';
import { loadInventory } from '../../../lib/inventory';
import { matchesReportFilters, reportFilters } from '../../../lib/report-filters';

export async function GET(request: NextRequest) {
  const { identityHeaders } = await currentUserContext();
  const result = await loadInventory(identityHeaders);
  if (!result.data) return NextResponse.json({ error: result.error }, { status: 502 });
  const type = request.nextUrl.searchParams.get('tipo') ?? 'lotes';
  const filters = reportFilters(request.nextUrl.searchParams);
  if (type === 'movimentos') return csvResponse('tier-trade-estoque-movimentos.csv', [
    ['Movimento', 'Tipo', 'Lote', 'Carga', 'Recebimento', 'Alocação', 'Expedição', 'Quantidade kg', 'Ocorrido em', 'Registrado em'],
    ...result.data.movements.filter((item) => matchesReportFilters(filters, item.occurredAt, [item.type, item.lotCode, item.sourceLoadId, item.sourceReceiptId, item.allocationId, item.dispatchId])).map((item) => [item.id, item.type, item.lotCode, item.sourceLoadId, item.sourceReceiptId, item.allocationId, item.dispatchId, item.quantityDeltaKg, item.occurredAt, item.recordedAt]),
  ]);
  if (type === 'vendas') return csvResponse('tier-trade-estoque-vendas.csv', [
    ['Contrato', 'Versão', 'Cliente', 'Commodity', 'Quantidade kg', 'Alocado kg', 'Expedido kg', 'Saldo kg', 'Preço por kg', 'Destino', 'Status'],
    ...result.data.salesContracts.filter((item) => matchesReportFilters(filters, item.delivery_start, [item.reference, item.counterparty_name, item.commodity, item.destination_code, item.status])).map((item) => [item.reference, item.version_number, item.counterparty_name, item.commodity, item.quantity_kg, item.allocated_kg, item.dispatched_kg, String(Number(item.quantity_kg) - Number(item.dispatched_kg)), item.sale_price_per_kg, item.destination_code, item.status]),
  ]);
  return csvResponse('tier-trade-estoque-lotes.csv', [
    ['Lote', 'Carga de origem', 'Contrato', 'Versão', 'Local', 'Commodity', 'Titularidade', 'Risco', 'Custódia', 'Quantidade kg', 'Comprometido kg', 'Disponível kg', 'Umidade %', 'Impureza %', 'Status'],
    ...result.data.lots.filter((item) => matchesReportFilters(filters, item.createdAt, [item.lotCode, item.sourceLoadId, item.contractId, item.location.code, item.location.name, item.commodity, item.ownershipStatus, item.riskStatus, item.custodyStatus, item.status])).map((item) => [item.lotCode, item.sourceLoadId, item.contractId, item.contractVersionNumber, `${item.location.code} - ${item.location.name}`, item.commodity, item.ownershipStatus, item.riskStatus, item.custodyStatus, item.quantityKg, item.committedKg, item.availableKg, item.quality.moisturePct, item.quality.impurityPct, item.status]),
  ]);
}
