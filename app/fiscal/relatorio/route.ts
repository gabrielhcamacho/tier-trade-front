import { NextRequest, NextResponse } from 'next/server';
import { currentUserContext } from '../../../lib/current-user';
import { csvResponse } from '../../../lib/csv';
import { loadFiscal } from '../../../lib/fiscal';

export async function GET(request: NextRequest) {
  const { identityHeaders } = await currentUserContext();
  const result = await loadFiscal(identityHeaders);
  if (!result.data) return NextResponse.json({ error: result.error }, { status: 502 });
  const type = request.nextUrl.searchParams.get('tipo') ?? 'documentos';

  if (type === 'calculos') return csvResponse('tier-trade-fiscal-calculos.csv', [
    ['Cálculo', 'Configuração', 'Versão', 'Estabelecimento', 'Operação', 'Commodity', 'UF destino', 'Data', 'Valor bruto', 'Tributos', 'Retidos', 'Valor líquido', 'Status'],
    ...result.data.calculations.map((item) => [item.id, item.configuration.key, item.configuration.version, item.establishment.name, item.context.operationType, item.context.commodity, item.context.destinationUf, item.context.occurredOn, item.result.grossAmount, item.result.taxTotal, item.result.retainedTotal, item.result.netAmount, item.status]),
  ]);
  if (type === 'obrigacoes') return csvResponse('tier-trade-fiscal-obrigacoes.csv', [
    ['Obrigação', 'Tributo', 'Autoridade', 'Competência', 'Vencimento', 'Valor', 'Retido', 'Responsável', 'Status', 'Título', 'Pago', 'Saldo'],
    ...result.data.obligations.map((item) => [item.id, item.tax, item.authority.name, item.competenceDate, item.dueDate, item.amount, item.retained ? 'Sim' : 'Não', item.paymentResponsibility, item.status, item.payable?.titleNumber, item.payable?.paidAmount, item.payable?.outstandingAmount]),
  ]);
  if (type === 'entradas') return csvResponse('tier-trade-fiscal-entradas.csv', [
    ['Documento', 'Contrato de compra', 'Versão', 'Carga', 'Recebimento', 'Fornecedor', 'Commodity', 'NF-e', 'Série', 'Chave', 'Emissão', 'Valor', 'Valor esperado', 'Diferença', 'Vencimento', 'Título', 'Peso aceito kg', 'Status'],
    ...result.data.purchaseDocuments.map((item) => [item.id, item.purchaseContractId, item.contractVersionNumber, item.loadId, item.loadReceiptId, item.counterpartyName, item.commodity, item.documentNumber, item.invoiceSeries, item.accessKey, item.issuedAt, item.totalAmount, item.expectedAmount, item.differenceAmount, item.dueDate, item.titleNumber, item.acceptedWeightKg, item.status]),
  ]);
  return csvResponse('tier-trade-fiscal-saidas.csv', [
    ['Documento', 'Contrato de venda', 'Versão', 'Contrato', 'Cliente', 'Expedição', 'NF-e', 'Chave', 'Emissão', 'Valor', 'Valor esperado', 'Diferença', 'Status', 'Título'],
    ...result.data.documents.map((item) => [item.id, item.salesContractId, item.salesContractVersionNumber, item.contractReference, item.counterpartyName, item.dispatchReference, item.documentNumber, item.accessKey, item.issuedAt, item.totalAmount, item.expectedAmount, item.differenceAmount, item.status, item.title?.number]),
  ]);
}
