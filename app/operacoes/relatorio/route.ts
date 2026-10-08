import { NextRequest, NextResponse } from 'next/server';
import { currentUserContext } from '../../../lib/current-user';
import { csvResponse } from '../../../lib/csv';
import { loadOccurrenceBoard, loadQualityBoard, loadReceivingBoard, loadYardBoard } from '../../../lib/loads';
import { matchesReportFilters, reportFilters } from '../../../lib/report-filters';

export async function GET(request: NextRequest) {
  const { identityHeaders } = await currentUserContext();
  const type = request.nextUrl.searchParams.get('tipo') ?? 'recebimentos';
  const filters = reportFilters(request.nextUrl.searchParams);
  if (type === 'patio') {
    const result = await loadYardBoard(identityHeaders);
    if (!result.data) return NextResponse.json({ error: result.error }, { status: 502 });
    return csvResponse('tier-trade-operacoes-patio.csv', [['Carga', 'Contrato', 'Programação', 'Veículo', 'Transportadora', 'Peso previsto kg', 'Estado no pátio', 'Local', 'Ocorrências abertas'], ...result.data.items.filter((item) => matchesReportFilters(filters, item.scheduledAt, [item.id, item.contractId, item.vehiclePlate, item.carrierName, item.yardState, item.yardLocationCode])).map((item) => [item.id, item.contractId, item.scheduledAt, item.vehiclePlate, item.carrierName, item.expectedWeightKg, item.yardState, item.yardLocationCode, item.openOccurrences])]);
  }
  if (type === 'ocorrencias') {
    const result = await loadOccurrenceBoard(identityHeaders);
    if (!result.data) return NextResponse.json({ error: result.error }, { status: 502 });
    return csvResponse('tier-trade-operacoes-ocorrencias.csv', [['Ocorrência', 'Carga', 'Contrato', 'Veículo', 'Categoria', 'Severidade', 'Título', 'Descrição', 'Ocorrido em', 'Status', 'Resolução', 'Resolvido em'], ...result.data.items.filter((item) => matchesReportFilters(filters, item.occurredAt, [item.loadId, item.contractId, item.vehiclePlate, item.category, item.severity, item.title, item.description, item.status, item.resolution])).map((item) => [item.id, item.loadId, item.contractId, item.vehiclePlate, item.category, item.severity, item.title, item.description, item.occurredAt, item.status, item.resolution, item.resolvedAt])]);
  }
  if (type === 'qualidade') {
    const result = await loadQualityBoard(identityHeaders);
    if (!result.data) return NextResponse.json({ error: result.error }, { status: 502 });
    return csvResponse('tier-trade-operacoes-qualidade.csv', [['Carga', 'Contrato', 'Veículo', 'Programação', 'Ticket', 'Peso aceito kg', 'Umidade %', 'Impurezas %', 'Avariados %', 'Quebrados %', 'Queimados %', 'Ardidos %', 'Decisão'], ...result.data.items.filter((item) => matchesReportFilters(filters, item.receipt?.receivedAt ?? item.scheduledAt, [item.id, item.contractId, item.vehiclePlate, item.receipt?.scaleTicketNumber, item.receipt?.qualityDecision, item.status])).map((item) => [item.id, item.contractId, item.vehiclePlate, item.scheduledAt, item.receipt?.scaleTicketNumber, item.receipt?.acceptedWeightKg, item.receipt?.moisturePct, item.receipt?.impurityPct, item.receipt?.damagedPct, item.receipt?.brokenPct, item.receipt?.burntPct, item.receipt?.heatDamagedPct, item.receipt?.qualityDecision])]);
  }
  const result = await loadReceivingBoard(identityHeaders);
  if (!result.data) return NextResponse.json({ error: result.error }, { status: 502 });
  return csvResponse('tier-trade-operacoes-recebimentos.csv', [['Carga', 'Contrato', 'Versão', 'Programação', 'Veículo', 'Transportadora', 'NF-e', 'Peso documento kg', 'Peso balança kg', 'Peso considerado kg', 'Peso aceito kg', 'Ticket', 'Decisão de qualidade', 'Status'], ...result.data.items.filter((item) => matchesReportFilters(filters, item.receipt?.receivedAt ?? item.scheduledAt, [item.id, item.contractId, item.vehiclePlate, item.carrierName, item.receipt?.inboundInvoiceNumber, item.receipt?.scaleTicketNumber, item.receipt?.qualityDecision, item.status])).map((item) => [item.id, item.contractId, item.contractVersionNumber, item.scheduledAt, item.vehiclePlate, item.carrierName, item.receipt?.inboundInvoiceNumber, item.receipt?.documentWeightKg, item.receipt?.arrivalWeightKg, item.receipt?.consideredWeightKg, item.receipt?.acceptedWeightKg, item.receipt?.scaleTicketNumber, item.receipt?.qualityDecision, item.status])]);
}
