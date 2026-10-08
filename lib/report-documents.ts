import { loadDocuments, type DocumentAggregateType, type StoredDocument } from './documents';
import type { ReportDomain, ReportRecord } from './report-explorer';

export type DocumentSource = { aggregateType: DocumentAggregateType; aggregateId: string; href: string | null };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function reportDocumentSources(domain: ReportDomain, type: string, record: ReportRecord): DocumentSource[] {
  const sources: DocumentSource[] = [];
  const add = (aggregateType: DocumentAggregateType, aggregateId: string | undefined, href: string | null) => {
    if (aggregateId && uuid.test(aggregateId) && !sources.some((item) => item.aggregateType === aggregateType && item.aggregateId === aggregateId)) {
      sources.push({ aggregateType, aggregateId, href });
    }
  };
  const field = (name: string) => record.fields.find(([label]) => label === name)?.[1];
  if (domain === 'fiscal' && type === 'documentos') add('FISCAL_DOCUMENT', record.id, '/fiscal?view=documents');
  if (domain === 'fiscal' && ['calculos', 'obrigacoes'].includes(type) && (field('Origem') ?? field('Origem fiscal')) === 'FISCAL_DOCUMENT') {
    add('FISCAL_DOCUMENT', field('ID da origem'), '/fiscal?view=documents');
  }
  if (domain === 'estoque' && type === 'lotes') add('INVENTORY_LOT', record.id, '/estoque?view=lots');
  if (domain === 'estoque' && type === 'vendas') add('SALES_CONTRACT', record.id, `/comercial/vendas/${record.id}`);
  if (domain === 'operacoes' && type !== 'ocorrencias') add('LOAD', record.id, `/cargas/${record.id}#documentos`);
  add('LOAD', field('Carga'), field('Carga') ? `/cargas/${field('Carga')}#documentos` : null);

  for (const link of record.links) {
    const path = link.href.split('?')[0]?.split('#')[0] ?? '';
    const load = /^\/cargas\/([0-9a-f-]+)$/i.exec(path);
    const contract = /^\/contratos\/([0-9a-f-]+)$/i.exec(path);
    const sale = /^\/comercial\/vendas\/([0-9a-f-]+)$/i.exec(path);
    if (path === '/relatorios/estoque' && link.href.includes('tipo=lotes')) {
      const lotId = new URL(link.href, 'https://tiertrade.local').searchParams.get('registro');
      add('INVENTORY_LOT', lotId ?? undefined, '/estoque?view=lots');
    }
    if (load) add('LOAD', load[1], `${path}#documentos`);
    if (contract) add('CONTRACT', contract[1], `${path}#documentos`);
    if (sale) add('SALES_CONTRACT', sale[1], path);
  }
  return sources;
}

export async function loadReportDocuments(identityHeaders: Record<string, string>, sources: DocumentSource[]): Promise<{
  items: StoredDocument[]; error: string | null;
}> {
  if (!sources.length) return { items: [], error: null };
  const results = await Promise.all(sources.map((source) => loadDocuments(identityHeaders, source.aggregateType, source.aggregateId)));
  return {
    items: [...new Map(results.flatMap((result) => result.items).map((item) => [item.id, item])).values()],
    error: results.find((result) => result.error)?.error ?? null,
  };
}
