import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUserContext } from '../../../lib/current-user';
import { loadReportView, reportDomains, type ReportDomain } from '../../../lib/report-explorer';
import { reportFilters } from '../../../lib/report-filters';
import { reportDate, reportField, reportStatus, reportValue } from '../../../lib/report-format';
import { documentTypeLabel, formatDocumentSize } from '../../../lib/documents';
import { loadReportDocuments, reportDocumentSources } from '../../../lib/report-documents';
import { AppShell } from '../../app-shell';
import { DemoPageHeader, DemoSection, DemoTable } from '../../demo-ui';
import { EmptyState, PageFeedback } from '../../page-state';
import { ReportFilterBar } from '../../report-filter-bar';
import { DetailNavigation } from '../../detail-navigation';

const sourcePages: Record<ReportDomain, string> = {
  financeiro: '/financeiro', fiscal: '/fiscal', estoque: '/estoque', operacoes: '/recebimentos',
};
const appDomains: Record<ReportDomain, 'financial' | 'fiscal' | 'inventory' | 'operations'> = {
  financeiro: 'financial', fiscal: 'fiscal', estoque: 'inventory', operacoes: 'operations',
};

export default async function ReportExplorerPage({
  params, searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ tipo?: string; de?: string; ate?: string; criterio?: string; registro?: string }>;
}) {
  const [{ domain }, query, user] = await Promise.all([params, searchParams, currentUserContext()]);
  if (!Object.hasOwn(reportDomains, domain)) notFound();
  const reportDomain = domain as ReportDomain;
  const filters = reportFilters(new URLSearchParams({ de: query.de ?? '', ate: query.ate ?? '', criterio: query.criterio ?? '' }));
  const report = await loadReportView(reportDomain, query.tipo, filters, user.identityHeaders);
  const selected = report.records.find((item) => item.id === query.registro);
  const sources = selected ? reportDocumentSources(reportDomain, report.type, selected) : [];
  const attachments = await loadReportDocuments(user.identityHeaders, sources);
  const selectedTypeLabel = report.types.find((item) => item.value === report.type)?.label ?? report.type;
  const queryFor = (recordId?: string) => {
    const params = new URLSearchParams({ tipo: report.type });
    if (filters.from) params.set('de', filters.from);
    if (filters.to) params.set('ate', filters.to);
    if (filters.criterion) params.set('criterio', filters.criterion);
    if (recordId) params.set('registro', recordId);
    return params.toString();
  };
  return (
    <AppShell activeDomain={appDomains[reportDomain]} userLabel={user.userLabel}>
      <DemoPageHeader domain={report.title} section="Relatórios" eyebrow="DADOS DO TENANT" title={`Relatório de ${selectedTypeLabel.toLocaleLowerCase('pt-BR')}`} description="Consulte o registro, seus vínculos e documentos de origem. A exportação utiliza os mesmos filtros." scope="Dados persistidos no backend" />
      <div className="demo-page demo-workspace report-explorer">
        <DetailNavigation backHref={sourcePages[reportDomain]} backLabel="Voltar ao módulo" items={[{ label: report.title, href: sourcePages[reportDomain] }, { label: 'Relatórios' }]} />
        <ReportFilterBar action={report.exportPath} types={report.types} defaultType={report.type} initialFrom={filters.from ?? ''} initialTo={filters.to ?? ''} initialCriterion={query.criterio ?? ''} />
        {report.error ? <PageFeedback title="Não foi possível consultar o relatório" message={report.error} action={{ href: sourcePages[reportDomain], label: 'Voltar ao módulo' }} /> : <>
          <DemoSection kicker="RESULTADOS" title={`${report.records.length} registro(s) encontrados`} aside="Selecione uma linha para examinar a origem">
            {report.records.length ? <DemoTable label={`Relatório de ${selectedTypeLabel}`} columns={['Referência', 'Data', 'Descrição', 'Valor ou quantidade', 'Situação']} rows={report.records.map((item) => [item.reference, reportDate(item.date), item.description, reportValue(reportDomain, item.value), reportStatus(item.status)])} rowHrefs={report.records.map((item) => `/relatorios/${reportDomain}?${queryFor(item.id)}#detalhe`)} /> : <EmptyState compact title="Nenhum registro neste filtro" description="Ajuste o período ou o critério para consultar os dados existentes." />}
          </DemoSection>
          {selected ? <DemoSection kicker="RASTREABILIDADE" title={selected.reference} aside={selected.id} id="detalhe">
            <div className="report-record-detail">
              <dl>{selected.fields.map(([label, value], index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd>{reportField(label, value)}</dd></div>)}</dl>
              <aside>
                <h3>Registros relacionados</h3>
                {selected.links.length ? <nav aria-label="Registros relacionados">{selected.links.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label} <span aria-hidden="true">→</span></Link>)}</nav> : <p>Não há uma tela de origem vinculada a este registro.</p>}
                <h3>Anexos armazenados</h3>
                {attachments.error ? <p role="alert">{attachments.error}</p> : attachments.items.filter((item) => item.status === 'AVAILABLE').length ? (
                  <ul className="report-attachments">{attachments.items.filter((item) => item.status === 'AVAILABLE').map((item) => <li key={item.id}>
                    <a href={`/documentos/${item.id}/download`}>{item.file_name} <span aria-hidden="true">↗</span></a>
                    <small>{documentTypeLabel(item.document_type)} · {formatDocumentSize(item.size_bytes)}</small>
                  </li>)}</ul>
                ) : <p>Nenhum arquivo armazenado para este registro. A referência textual de NF-e ou ticket não substitui o anexo.</p>}
                {sources.some((source) => source.href) ? <nav aria-label="Adicionar anexos">{sources.filter((source) => source.href).map((source) => <Link key={`${source.aggregateType}-${source.aggregateId}`} href={source.href!}>Ver anexos na origem <span aria-hidden="true">→</span></Link>)}</nav> : null}
                <Link href="/documentos">Consultar arquivo de documentos</Link>
                <Link href={`/relatorios/${reportDomain}?${queryFor()}`}>Fechar detalhe</Link>
              </aside>
            </div>
          </DemoSection> : query.registro ? <PageFeedback tone="info" title="Registro não localizado no filtro atual" message="Ele pode ter sido alterado ou estar fora do período selecionado." /> : null}
        </>}
      </div>
    </AppShell>
  );
}
