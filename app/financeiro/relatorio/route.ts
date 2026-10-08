import { NextRequest, NextResponse } from 'next/server';
import { currentUserContext } from '../../../lib/current-user';
import { csvResponse } from '../../../lib/csv';
import { loadFinance } from '../../../lib/finance';
import { matchesReportFilters, reportFilters } from '../../../lib/report-filters';

export async function GET(request: NextRequest) {
  const { identityHeaders } = await currentUserContext();
  const result = await loadFinance(identityHeaders);
  if (!result.data) return NextResponse.json({ error: result.error }, { status: 502 });

  const type = request.nextUrl.searchParams.get('tipo') ?? 'eventos';
  const filters = reportFilters(request.nextUrl.searchParams);
  if (type === 'titulos') {
    return csvResponse('tier-trade-financeiro-titulos.csv', [
      ['Título', 'Documento', 'Beneficiário', 'Direção', 'Vencimento', 'Valor', 'Ajustes', 'Liquidado', 'Saldo', 'Status', 'Contrato', 'Carga'],
      ...result.data.events.filter((event) => event.title && matchesReportFilters(filters, event.title.dueDate, [event.title.number, event.title.status, event.beneficiaryName, event.contractReference, event.loadId])).map((event) => [
        event.title?.number, event.title?.documentReference, event.beneficiaryName, event.direction,
        event.title?.dueDate, event.title?.amount, event.title?.adjustedAmount, event.title?.settledAmount,
        event.title?.outstandingAmount, event.title?.status, event.contractReference, event.loadId,
      ]),
    ]);
  }
  if (type === 'liquidacoes') {
    return csvResponse('tier-trade-financeiro-liquidacoes.csv', [
      ['Tipo', 'Registro', 'Título', 'Beneficiário', 'Valor', 'Data', 'Referência bancária', 'Observações', 'Estornado em', 'Motivo do estorno'],
      ...result.data.settlements.filter((item) => matchesReportFilters(filters, item.receivedAt, [item.titleNumber, item.bankReference, item.notes, item.reversalReason])).map((item) => ['Recebimento', item.id, item.titleNumber, '', item.amount, item.receivedAt, item.bankReference, item.notes, item.reversedAt, item.reversalReason]),
      ...result.data.payments.filter((item) => matchesReportFilters(filters, item.paidAt, [item.titleNumber, item.beneficiaryName, item.bankReference, item.notes, item.reversalReason])).map((item) => ['Pagamento', item.id, item.titleNumber, item.beneficiaryName, item.amount, item.paidAt, item.bankReference, item.notes, item.reversedAt, item.reversalReason]),
    ]);
  }
  if (type === 'conciliacao') {
    return csvResponse('tier-trade-financeiro-conciliacao.csv', [
      ['Conta', 'Data', 'Direção', 'Valor', 'Referência bancária', 'Descrição', 'Status', 'Tipo conciliado', 'Registro conciliado'],
      ...result.data.governance.bankStatementEntries.filter((item) => matchesReportFilters(filters, item.occurred_at, [item.bank_account_code, item.direction, item.bank_reference, item.description, item.status, item.matched_type])).map((item) => [item.bank_account_code, item.occurred_at, item.direction, item.amount, item.bank_reference, item.description, item.status, item.matched_type, item.matched_id]),
    ]);
  }
  return csvResponse('tier-trade-financeiro-eventos.csv', [
    ['Evento', 'Tipo', 'Direção', 'Beneficiário', 'Contrato', 'Carga', 'Documento', 'Quantidade kg', 'Valor unitário', 'Valor calculado', 'Situação do cálculo', 'Previsão', 'Fórmula', 'Versão'],
    ...result.data.events.filter((event) => matchesReportFilters(filters, event.dispatchedAt ?? event.expectedOn, [event.eventType, event.direction, event.beneficiaryName, event.contractReference, event.loadId, event.dispatchDocumentReference, event.calculationStatus])).map((event) => [event.id, event.eventType, event.direction, event.beneficiaryName, event.contractReference, event.loadId, event.dispatchDocumentReference, event.quantityKg, event.unitPrice, event.calculatedAmount, event.calculationStatus, event.expectedOn, event.formulaCode, event.formulaVersion]),
  ]);
}
