import { loadFinance } from './finance';
import { loadFiscal } from './fiscal';
import { loadInventory } from './inventory';
import { loadOccurrenceBoard, loadQualityBoard, loadReceivingBoard, loadYardBoard } from './loads';
import { matchesReportFilters, type ReportFilters } from './report-filters';

export type ReportRecord = {
  id: string;
  reference: string;
  date: string | null;
  description: string;
  value: string;
  status: string;
  fields: Array<[string, string]>;
  links: Array<{ label: string; href: string }>;
};

export type ReportView = {
  title: string;
  types: Array<{ value: string; label: string }>;
  type: string;
  exportPath: string;
  records: ReportRecord[];
  error: string | null;
};

export const reportDomains = {
  financeiro: {
    title: 'Financeiro', exportPath: '/financeiro/relatorio',
    types: [{ value: 'eventos', label: 'Eventos' }, { value: 'titulos', label: 'Títulos' }, { value: 'liquidacoes', label: 'Liquidações' }, { value: 'conciliacao', label: 'Conciliação' }],
  },
  fiscal: {
    title: 'Fiscal', exportPath: '/fiscal/relatorio',
    types: [{ value: 'documentos', label: 'Saídas' }, { value: 'entradas', label: 'Entradas' }, { value: 'calculos', label: 'Cálculos' }, { value: 'obrigacoes', label: 'Obrigações' }],
  },
  estoque: {
    title: 'Estoque', exportPath: '/estoque/relatorio',
    types: [{ value: 'lotes', label: 'Lotes' }, { value: 'movimentos', label: 'Movimentos' }, { value: 'vendas', label: 'Vendas' }],
  },
  operacoes: {
    title: 'Operações', exportPath: '/operacoes/relatorio',
    types: [{ value: 'recebimentos', label: 'Recebimentos' }, { value: 'patio', label: 'Pátio' }, { value: 'qualidade', label: 'Qualidade' }, { value: 'ocorrencias', label: 'Ocorrências' }],
  },
} as const;

export type ReportDomain = keyof typeof reportDomains;

const value = (input: string | number | null | undefined) => input === null || input === undefined || input === '' ? '—' : String(input);
const fields = (entries: Array<[string, string | number | null | undefined]>): Array<[string, string]> => entries.map(([label, item]) => [label, value(item)]);
const related = (label: string, href: string | null | undefined) => href ? [{ label, href }] : [];

export async function loadReportView(domain: ReportDomain, requestedType: string | undefined, filters: ReportFilters, identityHeaders: Record<string, string>): Promise<ReportView> {
  const config = reportDomains[domain];
  const type = config.types.some((item) => item.value === requestedType) ? requestedType! : config.types[0].value;
  const base = { title: config.title, types: [...config.types], type, exportPath: config.exportPath };
  if (domain === 'financeiro') {
    const result = await loadFinance(identityHeaders);
    if (!result.data) return { ...base, records: [], error: result.error };
    const data = result.data;
    const eventLink = (event: typeof data.events[number]) => event.direction === 'INFLOW'
      ? [...related('Abrir recebível e memória de cálculo', `/financeiro/liquidacoes/${event.id}`),
        ...related('Abrir contrato de venda', event.salesContractId ? `/comercial/vendas/${event.salesContractId}` : null)]
      : [...related('Abrir carga de origem', event.loadId ? `/cargas/${event.loadId}` : null), ...related('Abrir contrato de compra', event.purchaseContractId ? `/contratos/${event.purchaseContractId}` : null)];
    let records: ReportRecord[] = [];
    if (type === 'eventos') records = data.events.filter((item) => matchesReportFilters(filters, item.dispatchedAt ?? item.expectedOn, [item.eventType, item.direction, item.beneficiaryName, item.contractReference, item.loadId, item.dispatchDocumentReference, item.calculationStatus])).map((item) => ({
      id: item.id, reference: item.contractReference ?? item.id, date: item.dispatchedAt ?? item.expectedOn,
      description: item.beneficiaryName, value: value(item.calculatedAmount), status: item.calculationStatus,
      fields: fields([['Evento', item.id], ['Tipo', item.eventType], ['Direção', item.direction], ['Beneficiário', item.beneficiaryName], ['Contrato', item.contractReference], ['Carga', item.loadId], ['Documento', item.dispatchDocumentReference], ['Quantidade kg', item.quantityKg], ['Preço unitário', item.unitPrice], ['Valor calculado', item.calculatedAmount], ['Previsão', item.expectedOn], ['Fórmula', item.formulaCode], ['Versão', item.formulaVersion], ['Título', item.title?.number]]),
      links: eventLink(item),
    }));
    if (type === 'titulos') records = data.events.filter((item) => item.title && matchesReportFilters(filters, item.title.dueDate, [item.title.number, item.title.status, item.beneficiaryName, item.contractReference, item.loadId])).map((item) => ({
      id: item.title!.id, reference: item.title!.number, date: item.title!.dueDate, description: item.beneficiaryName,
      value: item.title!.amount, status: item.title!.status,
      fields: fields([['Título', item.title!.number], ['Documento', item.title!.documentReference], ['Beneficiário', item.beneficiaryName], ['Direção', item.direction], ['Vencimento', item.title!.dueDate], ['Valor', item.title!.amount], ['Ajustes', item.title!.adjustedAmount], ['Liquidado', item.title!.settledAmount], ['Saldo', item.title!.outstandingAmount], ['Contrato', item.contractReference], ['Carga', item.loadId], ['Evento', item.id]]),
      links: eventLink(item),
    }));
    if (type === 'liquidacoes') {
      const byTitle = new Map(data.events.filter((item) => item.title).map((item) => [item.title!.id, item]));
      records = [
        ...data.settlements.filter((item) => matchesReportFilters(filters, item.receivedAt, [item.titleNumber, item.bankReference, item.notes, item.reversalReason])).map((item) => {
          const event = byTitle.get(item.titleId);
          return { id: item.id, reference: item.titleNumber, date: item.receivedAt, description: 'Recebimento', value: item.amount, status: item.reversedAt ? 'Estornado' : 'Confirmado', fields: fields([['Registro', item.id], ['Título', item.titleNumber], ['Valor', item.amount], ['Data', item.receivedAt], ['Referência bancária', item.bankReference], ['Observações', item.notes], ['Estornado em', item.reversedAt], ['Motivo do estorno', item.reversalReason]]), links: event ? eventLink(event) : [] };
        }),
        ...data.payments.filter((item) => matchesReportFilters(filters, item.paidAt, [item.titleNumber, item.beneficiaryName, item.bankReference, item.notes, item.reversalReason])).map((item) => {
          const event = byTitle.get(item.titleId);
          return { id: item.id, reference: item.titleNumber, date: item.paidAt, description: `Pagamento · ${item.beneficiaryName}`, value: item.amount, status: item.reversedAt ? 'Estornado' : 'Confirmado', fields: fields([['Registro', item.id], ['Título', item.titleNumber], ['Beneficiário', item.beneficiaryName], ['Valor', item.amount], ['Data', item.paidAt], ['Referência bancária', item.bankReference], ['Observações', item.notes], ['Estornado em', item.reversedAt], ['Motivo do estorno', item.reversalReason], ['Obrigação fiscal', item.fiscalObligationId], ['Recebimento de compra', item.purchaseReceiptId]]), links: event ? eventLink(event) : [] };
        }),
      ];
    }
    if (type === 'conciliacao') records = data.governance.bankStatementEntries.filter((item) => matchesReportFilters(filters, item.occurred_at, [item.bank_account_code, item.direction, item.bank_reference, item.description, item.status, item.matched_type])).map((item) => ({
      id: item.id, reference: item.bank_reference, date: item.occurred_at, description: `${item.bank_account_code} · ${item.description ?? item.direction}`, value: item.amount, status: item.status,
      fields: fields([['Conta', item.bank_account_code], ['Direção', item.direction], ['Descrição', item.description], ['Referência bancária', item.bank_reference], ['Valor', item.amount], ['Status', item.status], ['Tipo conciliado', item.matched_type], ['Registro conciliado', item.matched_id], ['Lote de importação', item.import_id], ['Linha de origem', item.source_line_number]]),
      links: [...related('Abrir financeiro', '/financeiro?view=reconciliation'), ...related('Abrir recebível conciliado', item.matched_type === 'SETTLEMENT' && item.matched_id ? (() => { const settlement = data.settlements.find((entry) => entry.id === item.matched_id); const event = data.events.find((entry) => entry.title?.id === settlement?.titleId); return event?.direction === 'INFLOW' ? `/financeiro/liquidacoes/${event.id}` : null; })() : null)],
    }));
    return { ...base, records, error: null };
  }

  if (domain === 'fiscal') {
    const result = await loadFiscal(identityHeaders);
    if (!result.data) return { ...base, records: [], error: result.error };
    const data = result.data;
    let records: ReportRecord[] = [];
    if (type === 'documentos') records = data.documents.filter((item) => matchesReportFilters(filters, item.issuedAt, [item.salesContractId, item.contractReference, item.counterpartyName, item.dispatchReference, item.documentNumber, item.status, item.title?.number])).map((item) => ({
      id: item.id, reference: `NF-e ${item.documentNumber}`, date: item.issuedAt, description: item.counterpartyName, value: item.totalAmount, status: item.status,
      fields: fields([['Documento', item.id], ['Contrato', item.contractReference], ['Versão contratual', item.salesContractVersionNumber], ['Expedição', item.dispatchReference], ['Número NF-e', item.documentNumber], ['Chave de acesso', item.accessKey], ['Valor', item.totalAmount], ['Valor esperado', item.expectedAmount], ['Diferença', item.differenceAmount], ['Título', item.title?.number], ['Validação', item.validationNotes], ['Rejeição', item.rejectionReason]]),
      links: related('Abrir contrato de venda', `/comercial/vendas/${item.salesContractId}`),
    }));
    if (type === 'entradas') records = data.purchaseDocuments.filter((item) => matchesReportFilters(filters, item.issuedAt, [item.purchaseContractId, item.loadId, item.counterpartyName, item.commodity, item.documentNumber, item.titleNumber, item.status])).map((item) => ({
      id: item.id, reference: `NF-e ${item.documentNumber}`, date: item.issuedAt, description: item.counterpartyName, value: item.totalAmount, status: item.status,
      fields: fields([['Documento', item.id], ['Contrato', item.purchaseContractId], ['Versão contratual', item.contractVersionNumber], ['Carga', item.loadId], ['Recebimento', item.loadReceiptId], ['Produto', item.commodity], ['Série', item.invoiceSeries], ['Chave de acesso', item.accessKey], ['Valor', item.totalAmount], ['Valor esperado', item.expectedAmount], ['Diferença', item.differenceAmount], ['Vencimento', item.dueDate], ['Título', item.titleNumber], ['Peso aceito kg', item.acceptedWeightKg], ['Validação', item.validationNotes], ['Rejeição', item.rejectionReason]]),
      links: [...related('Abrir carga e documentos de origem', `/cargas/${item.loadId}`), ...related('Abrir contrato de compra', `/contratos/${item.purchaseContractId}`)],
    }));
    if (type === 'calculos') records = data.calculations.filter((item) => matchesReportFilters(filters, item.context.occurredOn, [item.configuration.key, item.establishment.name, item.context.operationType, item.context.commodity, item.context.destinationUf, item.status])).map((item) => ({
      id: item.id, reference: `${item.configuration.key} · v${item.configuration.version}`, date: item.context.occurredOn, description: `${item.establishment.name} · ${item.context.commodity}`, value: item.result.netAmount, status: item.status,
      fields: fields([['Cálculo', item.id], ['Configuração', item.configuration.key], ['Versão', item.configuration.version], ['Operação', item.context.operationType], ['UF destino', item.context.destinationUf], ['Origem', item.context.sourceType], ['ID da origem', item.context.sourceId], ['Bruto', item.result.grossAmount], ['Tributos', item.result.taxTotal], ['Retidos', item.result.retainedTotal], ['Líquido', item.result.netAmount], ['Arredondamento', `${item.result.rounding.mode} · ${item.result.rounding.scale} casas`], ...item.result.components.map((component): [string, string] => [`${component.tax} · ${component.treatment}`, `${component.amount} (base ${component.taxableBase}; alíquota ${value(component.ratePct)}%; sem arredondar ${component.unroundedAmount}) · ${component.explanation}`])]),
      links: [...related('Abrir fiscal', '/fiscal?view=calculations'), ...related('Abrir documento fiscal de origem', item.context.sourceType === 'FISCAL_DOCUMENT' && item.context.sourceId ? `/relatorios/fiscal?tipo=${data.purchaseDocuments.some((document) => document.id === item.context.sourceId) ? 'entradas' : 'documentos'}&registro=${encodeURIComponent(item.context.sourceId)}` : null)],
    }));
    if (type === 'obrigacoes') records = data.obligations.filter((item) => matchesReportFilters(filters, item.dueDate, [item.tax, item.authority.name, item.paymentResponsibility, item.status, item.payable?.titleNumber])).map((item) => ({
      id: item.id, reference: `${item.tax} · ${item.authority.name}`, date: item.dueDate, description: item.paymentResponsibility, value: item.amount, status: item.status,
      fields: fields([['Obrigação', item.id], ['Cálculo', item.calculationId], ['Origem fiscal', data.calculations.find((calculation) => calculation.id === item.calculationId)?.context.sourceType], ['ID da origem', data.calculations.find((calculation) => calculation.id === item.calculationId)?.context.sourceId], ['Competência', item.competenceDate], ['Vencimento', item.dueDate], ['Tributo', item.tax], ['Autoridade', item.authority.name], ['Retido', item.retained ? 'Sim' : 'Não'], ['Responsável', item.paymentResponsibility], ['Valor', item.amount], ['Título', item.payable?.titleNumber], ['Pago', item.payable?.paidAmount], ['Saldo', item.payable?.outstandingAmount]]),
      links: related('Abrir cálculo fiscal', `/relatorios/fiscal?tipo=calculos&registro=${encodeURIComponent(item.calculationId)}`),
    }));
    return { ...base, records, error: null };
  }

  if (domain === 'estoque') {
    const result = await loadInventory(identityHeaders);
    if (!result.data) return { ...base, records: [], error: result.error };
    const data = result.data;
    let records: ReportRecord[] = [];
    if (type === 'lotes') records = data.lots.filter((item) => matchesReportFilters(filters, item.createdAt, [item.lotCode, item.sourceLoadId, item.contractId, item.location.code, item.location.name, item.commodity, item.ownershipStatus, item.riskStatus, item.custodyStatus, item.status])).map((item) => ({
      id: item.id, reference: item.lotCode, date: item.createdAt, description: `${item.location.name} · ${item.commodity}`, value: `${item.availableKg} kg disponíveis`, status: item.status,
      fields: fields([['Lote', item.lotCode], ['Carga de origem', item.sourceLoadId], ['Contrato', item.contractId], ['Versão contratual', item.contractVersionNumber], ['Local', `${item.location.code} · ${item.location.name}`], ['Produto', item.commodity], ['Titularidade', item.ownershipStatus], ['Risco', item.riskStatus], ['Custódia', item.custodyStatus], ['Quantidade kg', item.quantityKg], ['Comprometido kg', item.committedKg], ['Disponível kg', item.availableKg], ['Umidade %', item.quality.moisturePct], ['Impureza %', item.quality.impurityPct]]),
      links: [...related('Abrir carga de origem', `/cargas/${item.sourceLoadId}`), ...related('Abrir contrato de compra', `/contratos/${item.contractId}`)],
    }));
    if (type === 'movimentos') records = data.movements.filter((item) => matchesReportFilters(filters, item.occurredAt, [item.type, item.lotCode, item.sourceLoadId, item.sourceReceiptId, item.allocationId, item.dispatchId])).map((item) => ({
      id: item.id, reference: item.lotCode, date: item.occurredAt, description: item.type, value: `${item.quantityDeltaKg} kg`, status: item.type,
      fields: fields([['Movimento', item.id], ['Lote', item.lotCode], ['Carga', item.sourceLoadId], ['Recebimento', item.sourceReceiptId], ['Alocação', item.allocationId], ['Expedição', item.dispatchId], ['Quantidade kg', item.quantityDeltaKg], ['Ocorrido em', item.occurredAt], ['Registrado em', item.recordedAt]]),
      links: [...related('Abrir carga de origem', item.sourceLoadId ? `/cargas/${item.sourceLoadId}` : null), ...related('Abrir lote', `/relatorios/estoque?tipo=lotes&registro=${encodeURIComponent(item.lotId)}`)],
    }));
    if (type === 'vendas') records = data.salesContracts.filter((item) => matchesReportFilters(filters, item.delivery_start, [item.reference, item.counterparty_name, item.commodity, item.destination_code, item.status])).map((item) => ({
      id: item.id, reference: item.reference, date: item.delivery_start, description: `${item.counterparty_name} · ${item.commodity}`, value: `${item.quantity_kg} kg`, status: item.status,
      fields: fields([['Contrato', item.reference], ['Versão', item.version_number], ['Cliente', item.counterparty_name], ['Produto', item.commodity], ['Contratado kg', item.quantity_kg], ['Alocado kg', item.allocated_kg], ['Expedido kg', item.dispatched_kg], ['Preço por kg', item.sale_price_per_kg], ['Destino', item.destination_code]]),
      links: related('Abrir contrato de venda', `/comercial/vendas/${item.id}`),
    }));
    return { ...base, records, error: null };
  }

  const result = type === 'patio' ? await loadYardBoard(identityHeaders)
    : type === 'qualidade' ? await loadQualityBoard(identityHeaders)
      : type === 'ocorrencias' ? await loadOccurrenceBoard(identityHeaders)
        : await loadReceivingBoard(identityHeaders);
  if (!result.data) return { ...base, records: [], error: result.error };
  let records: ReportRecord[] = [];
  if (type === 'patio') {
    const board = result.data as Awaited<ReturnType<typeof loadYardBoard>>['data'];
    records = board!.items.filter((item) => matchesReportFilters(filters, item.scheduledAt, [item.id, item.contractId, item.vehiclePlate, item.carrierName, item.yardState, item.yardLocationCode])).map((item) => ({
      id: item.id, reference: item.vehiclePlate, date: item.scheduledAt, description: item.carrierName, value: `${item.expectedWeightKg} kg`, status: item.yardState,
      fields: fields([['Carga', item.id], ['Contrato', item.contractId], ['Programação', item.scheduledAt], ['Veículo', item.vehiclePlate], ['Transportadora', item.carrierName], ['Peso previsto kg', item.expectedWeightKg], ['Estado no pátio', item.yardState], ['Local', item.yardLocationCode], ['Ocorrências abertas', item.openOccurrences]]),
      links: related('Abrir carga e eventos de pátio', `/cargas/${item.id}`),
    }));
  } else if (type === 'ocorrencias') {
    const board = result.data as Awaited<ReturnType<typeof loadOccurrenceBoard>>['data'];
    records = board!.items.filter((item) => matchesReportFilters(filters, item.occurredAt, [item.loadId, item.contractId, item.vehiclePlate, item.category, item.severity, item.title, item.description, item.status, item.resolution])).map((item) => ({
      id: item.id, reference: item.title, date: item.occurredAt, description: `${item.vehiclePlate} · ${item.category}`, value: item.severity, status: item.status,
      fields: fields([['Ocorrência', item.id], ['Carga', item.loadId], ['Contrato', item.contractId], ['Veículo', item.vehiclePlate], ['Categoria', item.category], ['Severidade', item.severity], ['Descrição', item.description], ['Ocorrido em', item.occurredAt], ['Resolução', item.resolution], ['Resolvido em', item.resolvedAt]]),
      links: related('Abrir carga e ocorrência', `/cargas/${item.loadId}`),
    }));
  } else {
    const board = result.data as Awaited<ReturnType<typeof loadReceivingBoard>>['data'];
    records = board!.items.filter((item) => type === 'qualidade'
      ? matchesReportFilters(filters, item.receipt?.receivedAt ?? item.scheduledAt, [item.id, item.contractId, item.vehiclePlate, item.receipt?.scaleTicketNumber, item.receipt?.qualityDecision, item.status])
      : matchesReportFilters(filters, item.receipt?.receivedAt ?? item.scheduledAt, [item.id, item.contractId, item.vehiclePlate, item.carrierName, item.receipt?.inboundInvoiceNumber, item.receipt?.scaleTicketNumber, item.receipt?.qualityDecision, item.status])).map((item) => ({
        id: item.id, reference: item.vehiclePlate, date: item.receipt?.receivedAt ?? item.scheduledAt, description: `${item.carrierName} · carga ${item.id}`, value: item.receipt?.acceptedWeightKg ? `${item.receipt.acceptedWeightKg} kg aceitos` : `${item.expectedWeightKg} kg previstos`, status: item.receipt?.qualityDecision ?? item.status,
        fields: fields([['Carga', item.id], ['Contrato', item.contractId], ['Versão contratual', item.contractVersionNumber], ['Programação', item.scheduledAt], ['Veículo', item.vehiclePlate], ['Transportadora', item.carrierName], ['NF-e', item.receipt?.inboundInvoiceNumber], ['Peso documento kg', item.receipt?.documentWeightKg], ['Peso balança kg', item.receipt?.arrivalWeightKg], ['Peso considerado kg', item.receipt?.consideredWeightKg], ['Peso aceito kg', item.receipt?.acceptedWeightKg], ['Ticket', item.receipt?.scaleTicketNumber], ['Umidade %', item.receipt?.moisturePct], ['Impureza %', item.receipt?.impurityPct], ['Avariados %', item.receipt?.damagedPct], ['Quebrados %', item.receipt?.brokenPct], ['Queimados %', item.receipt?.burntPct], ['Ardidos %', item.receipt?.heatDamagedPct], ['Decisão de qualidade', item.receipt?.qualityDecision], ['Status', item.status]]),
        links: related('Abrir carga, romaneio e documentos', `/cargas/${item.id}`),
      }));
  }
  return { ...base, records, error: null };
}
