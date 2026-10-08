import Link from 'next/link';
import { AppShell } from '../app-shell';
import { DemoPageHeader, DemoSection } from '../demo-ui';
import { EmptyState, PageFeedback } from '../page-state';
import { currentUserContext } from '../../lib/current-user';
import { documentTypeLabel, formatDocumentSize, loadDocuments, type DocumentAggregateType, type DocumentType, type StoredDocument } from '../../lib/documents';

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
  searchParams: Promise<{ origem?: string; tipo?: string; estado?: string; de?: string; ate?: string; criterio?: string }>;
}) {
  const [query, user] = await Promise.all([searchParams, currentUserContext()]);
  const result = await loadDocuments(user.identityHeaders);
  const origin = origins.some((item) => item.value === query.origem) ? query.origem : '';
  const type = types.some((item) => item === query.tipo) ? query.tipo : '';
  const status = ['AVAILABLE', 'PENDING_UPLOAD', 'ARCHIVED'].includes(query.estado ?? '') ? query.estado : '';
  const from = /^\d{4}-\d{2}-\d{2}$/.test(query.de ?? '') ? query.de! : '';
  const to = /^\d{4}-\d{2}-\d{2}$/.test(query.ate ?? '') ? query.ate! : '';
  const criterion = (query.criterio ?? '').trim().toLocaleLowerCase('pt-BR');
  const documents = result.items.filter((item) => {
    const day = item.created_at.slice(0, 10);
    return (!origin || item.aggregate_type === origin) && (!type || item.document_type === type)
      && (!status || item.status === status) && (!from || day >= from) && (!to || day <= to)
      && (!criterion || [item.file_name, item.notes, item.aggregate_id, item.id].some((value) => value?.toLocaleLowerCase('pt-BR').includes(criterion)));
  });

  return <AppShell activeDomain="contracts" userLabel={user.userLabel}>
    <DemoPageHeader domain="Contratos" section="Documentos" eyebrow="ARQUIVO DO TENANT" title="Documentos e evidências" description="Consulte arquivos realmente armazenados, sua origem e a versão vinculada. O acesso ao arquivo é autorizado a cada download." scope="Armazenamento privado" />
    <div className="demo-page demo-workspace documents-archive">
      <form method="get" className="document-archive-filters" aria-label="Filtrar documentos">
        <label>Origem<select name="origem" defaultValue={origin}><option value="">Todas</option>{origins.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Tipo<select name="tipo" defaultValue={type}><option value="">Todos</option>{types.map((item) => <option key={item} value={item}>{documentTypeLabel(item)}</option>)}</select></label>
        <label>Situação<select name="estado" defaultValue={status}><option value="">Todas</option><option value="AVAILABLE">Disponível</option><option value="PENDING_UPLOAD">Envio pendente</option><option value="ARCHIVED">Arquivado</option></select></label>
        <label>De<input name="de" type="date" defaultValue={from} /></label>
        <label>Até<input name="ate" type="date" defaultValue={to} /></label>
        <label>Critério<input name="criterio" type="search" defaultValue={query.criterio ?? ''} placeholder="Arquivo, observação ou ID" /></label>
        <button type="submit">Filtrar</button>
      </form>
      {result.error ? <PageFeedback title="Não foi possível consultar os documentos" message={result.error} /> : <DemoSection kicker="ARQUIVOS E RASTREABILIDADE" title={`${documents.length} documento(s)`} aside="Somente arquivos disponíveis podem ser baixados">
        {documents.length ? <div className="document-archive-scroll"><table className="document-archive-table"><thead><tr><th>Arquivo</th><th>Tipo e versão</th><th>Origem</th><th>Registrado</th><th>Situação</th><th>Acesso</th></tr></thead><tbody>{documents.map((item) => <tr key={item.id}>
          <td><strong>{item.file_name}</strong>{item.notes ? <small>{item.notes}</small> : null}<small>{formatDocumentSize(item.size_bytes)}</small></td>
          <td>{documentTypeLabel(item.document_type)} · v{item.version}</td>
          <td><Link href={sourceHref(item)}>{origins.find((originItem) => originItem.value === item.aggregate_type)?.label ?? item.aggregate_type}</Link><small>{item.aggregate_id}</small></td>
          <td><time dateTime={item.created_at}>{dateLabel(item.created_at)}</time></td>
          <td>{item.status === 'AVAILABLE' ? 'Disponível' : item.status === 'PENDING_UPLOAD' ? 'Envio pendente' : 'Arquivado'}</td>
          <td>{item.status === 'AVAILABLE' ? <a href={`/documentos/${item.id}/download`}>Baixar arquivo</a> : '—'}</td>
        </tr>)}</tbody></table></div> : <EmptyState compact title="Nenhum documento neste filtro" description="Os arquivos devem ser enviados na tela da carga, contrato ou documento de origem. Referências textuais não são arquivos armazenados." />}
      </DemoSection>}
    </div>
  </AppShell>;
}
