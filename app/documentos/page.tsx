import Link from 'next/link';
import { AppShell } from '../app-shell';
import { DemoPageHeader, DemoSection } from '../demo-ui';
import { EmptyState, PageFeedback } from '../page-state';
import { currentUserContext } from '../../lib/current-user';
import { documentTypeLabel, formatDocumentSize, loadDocumentArchive, type DocumentAggregateType, type DocumentType, type StoredDocument } from '../../lib/documents';

const origins: Array<{ value: DocumentAggregateType; label: string }> = [
  { value: 'CONTRACT', label: 'Contrato de compra' },
  { value: 'SALES_CONTRACT', label: 'Contrato de venda' },
  { value: 'LOAD', label: 'Carga' },
  { value: 'FISCAL_DOCUMENT', label: 'Documento fiscal' },
  { value: 'COUNTERPARTY', label: 'Contraparte' },
  { value: 'INVENTORY_LOT', label: 'Lote de estoque' },
];
const types: DocumentType[] = ['CONTRACT_DRAFT', 'SIGNED_CONTRACT', 'AMENDMENT', 'GUARANTEE', 'INVOICE', 'ROMANEIO', 'QUALITY_REPORT', 'WEIGHING_TICKET', 'OTHER'];

function sourceHref(document: StoredDocument): string {
  switch (document.aggregate_type) {
    case 'CONTRACT': return `/contratos/${document.aggregate_id}#documentos`;
    case 'SALES_CONTRACT': return `/comercial/vendas/${document.aggregate_id}`;
    case 'LOAD': return `/cargas/${document.aggregate_id}#documentos`;
    case 'FISCAL_DOCUMENT': return '/fiscal?view=documents';
    case 'COUNTERPARTY': return '/comercial/carteira';
    case 'INVENTORY_LOT': return '/estoque?view=lots';
  }
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(date);
}

export default async function DocumentsArchivePage({ searchParams }: {
  searchParams: Promise<{ origem?: string; tipo?: string; estado?: string; de?: string; ate?: string; criterio?: string; pagina?: string }>;
}) {
  const [query, user] = await Promise.all([searchParams, currentUserContext()]);
  const origin = origins.find((item) => item.value === query.origem)?.value;
  const type = types.find((item) => item === query.tipo);
  const status = (['AVAILABLE', 'PENDING_UPLOAD', 'ARCHIVED'] as const).find((item) => item === query.estado);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(query.de ?? '') ? query.de! : '';
  const to = /^\d{4}-\d{2}-\d{2}$/.test(query.ate ?? '') ? query.ate! : '';
  const criterion = (query.criterio ?? '').trim().slice(0, 120);
  const requestedPage = /^\d{1,6}$/.test(query.pagina ?? '') ? Number(query.pagina) : 1;
  const page = requestedPage >= 1 && requestedPage <= 100_000 ? requestedPage : 1;
  const result = await loadDocumentArchive(user.identityHeaders, {
    aggregateType: origin, documentType: type, status, from: from || undefined,
    to: to || undefined, criterion: criterion || undefined, page,
  });
  const currentFilters = new URLSearchParams();
  if (origin) currentFilters.set('origem', origin);
  if (type) currentFilters.set('tipo', type);
  if (status) currentFilters.set('estado', status);
  if (from) currentFilters.set('de', from);
  if (to) currentFilters.set('ate', to);
  if (criterion) currentFilters.set('criterio', criterion);
  const pageHref = (target: number) => {
    const params = new URLSearchParams(currentFilters);
    if (target > 1) params.set('pagina', String(target));
    return `/documentos${params.size ? `?${params}` : ''}`;
  };

  return <AppShell activeDomain="contracts" userLabel={user.userLabel}>
    <DemoPageHeader domain="Contratos" section="Documentos" eyebrow="ARQUIVO DO TENANT" title="Documentos e evidências" description="Consulte arquivos realmente armazenados, sua origem e a versão vinculada. O acesso ao arquivo é autorizado a cada download." scope="Armazenamento privado" />
    <div className="demo-page demo-workspace documents-archive">
      <form method="get" className="document-archive-filters" aria-label="Filtrar documentos">
        <label>Origem<select name="origem" defaultValue={origin ?? ''}><option value="">Todas</option>{origins.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Tipo<select name="tipo" defaultValue={type ?? ''}><option value="">Todos</option>{types.map((item) => <option key={item} value={item}>{documentTypeLabel(item)}</option>)}</select></label>
        <label>Situação<select name="estado" defaultValue={status ?? ''}><option value="">Todas</option><option value="AVAILABLE">Disponível</option><option value="PENDING_UPLOAD">Envio pendente</option><option value="ARCHIVED">Arquivado</option></select></label>
        <label>De<input name="de" type="date" defaultValue={from} /></label>
        <label>Até<input name="ate" type="date" defaultValue={to} /></label>
        <label>Critério<input name="criterio" type="search" defaultValue={criterion} maxLength={120} placeholder="Arquivo, observação ou ID" /></label>
        <button type="submit">Filtrar</button>
      </form>
      {result.error ? <PageFeedback title="Não foi possível consultar os documentos" message={result.error} /> : <DemoSection kicker="ARQUIVOS E RASTREABILIDADE" title={`${result.total} documento(s)`} aside="Somente arquivos disponíveis podem ser baixados">
        {result.items.length ? <div className="document-archive-scroll"><table className="document-archive-table"><thead><tr><th>Arquivo</th><th>Tipo e versão</th><th>Origem</th><th>Registrado</th><th>Situação</th><th>Acesso</th></tr></thead><tbody>{result.items.map((item) => <tr key={item.id}>
          <td><strong>{item.file_name}</strong>{item.notes ? <small>{item.notes}</small> : null}<small>{formatDocumentSize(item.size_bytes)}</small></td>
          <td>{documentTypeLabel(item.document_type)} · v{item.version}</td>
          <td><Link href={sourceHref(item)}>{origins.find((originItem) => originItem.value === item.aggregate_type)?.label ?? item.aggregate_type}</Link><small>{item.aggregate_id}</small></td>
          <td><time dateTime={item.created_at}>{dateLabel(item.created_at)}</time></td>
          <td>{item.status === 'AVAILABLE' ? 'Disponível' : item.status === 'PENDING_UPLOAD' ? 'Envio pendente' : 'Arquivado'}</td>
          <td>{item.status === 'AVAILABLE' ? <a href={`/documentos/${item.id}/download`}>Baixar arquivo</a> : '—'}</td>
        </tr>)}</tbody></table></div> : <EmptyState compact title={result.total ? 'Nenhum documento nesta página' : 'Nenhum documento neste filtro'} description="Os arquivos devem ser enviados na tela da carga, contrato ou documento de origem. Referências textuais não são arquivos armazenados." />}
        {result.total > 0 ? <nav className="document-archive-pagination" aria-label="Páginas dos documentos">
          <span>Página {result.page} de {result.totalPages} · {result.items.length} nesta página</span>
          <div>
            {result.page > 1 ? <Link href={pageHref(result.page - 1)} rel="prev">Anterior</Link> : <span aria-disabled="true">Anterior</span>}
            {result.page < result.totalPages ? <Link href={pageHref(result.page + 1)} rel="next">Próxima</Link> : <span aria-disabled="true">Próxima</span>}
          </div>
        </nav> : null}
      </DemoSection>}
    </div>
  </AppShell>;
}
