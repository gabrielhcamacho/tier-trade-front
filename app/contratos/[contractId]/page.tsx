import { Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { DetailNavigation } from '../../detail-navigation';
import { currentUserContext } from '../../../lib/current-user';
import { loadDocuments, type StoredDocument } from '../../../lib/documents';
import { DocumentPanel } from '../../documents/document-panel';
import { ContractObligations } from '../contract-obligations';
import { PurchaseTerms } from '../purchase-terms';
import { ContractLifecycle } from '../contract-lifecycle';
import {
  commodityLabel,
  contractStatusLabel,
  formatCurrency,
  formatDate,
  formatQuantity,
  loadContractSummary,
  loadContractVersions,
  unitLabel,
  type ContractSummary,
  type ContractVersion,
} from '../../../lib/contracts';
import { PageFeedback } from '../../page-state';

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const [{ contractId }, user] = await Promise.all([params, currentUserContext()]);
  const [result, documentResult, versionsResult] = await Promise.all([
    loadContractSummary(contractId, user.identityHeaders),
    loadDocuments(user.identityHeaders, 'CONTRACT', contractId),
    loadContractVersions(contractId, user.identityHeaders),
  ]);

  return (
    <AppShell activeDomain="contracts" userLabel={user.userLabel}>
      {result.error ? <ContractError message={result.error} /> : null}
      {result.summary ? <ContractDetail
        summary={result.summary}
        documents={documentResult.items}
        documentError={documentResult.error}
        versions={versionsResult.versions}
        versionsError={versionsResult.error}
      /> : null}
    </AppShell>
  );
}

function ContractError({ message }: { message: string }) {
  return (
    <>
      <header className="page-header">
        <DetailNavigation backHref="/contratos" backLabel="Voltar aos contratos" items={[{ label: 'Contratos', href: '/contratos' }, { label: 'Detalhe' }]} />
        <h1>Contrato indisponível</h1>
      </header>
      <PageFeedback title="Não foi possível abrir o contrato" message={message} action={{ href: '/contratos', label: 'Voltar aos contratos' }} />
    </>
  );
}

function ContractDetail({ summary, documents, documentError, versions, versionsError }: {
  summary: ContractSummary;
  documents: StoredDocument[];
  documentError: string | null;
  versions: ContractVersion[];
  versionsError: string | null;
}) {
  const signed = summary.obligations.find((item) => item.code === 'SIGNED_CONTRACT');
  const hasSignedDocument = !documentError && documents.some((item) =>
    item.document_type === 'SIGNED_CONTRACT' && item.status === 'AVAILABLE');
  return (
    <>
      <header className="entity-header">
        <DetailNavigation backHref="/contratos" backLabel="Voltar aos contratos" items={[{ label: 'Contratos', href: '/contratos' }, { label: summary.id, mono: true }]} />
        <div className="entity-title-row">
          <div>
            <p className="entity-kind">Contrato de compra</p>
            <h1>{commodityLabel(summary.commodity)} · {formatQuantity(summary.quantity_sc)} sc</h1>
            <p className="entity-id tt-mono">{summary.purchase_terms?.externalNumber ?? summary.id}</p>
          </div>
          <div className="entity-actions">
            <Status tone="positive">{contractStatusLabel(summary.status)}</Status>
            <Link className="tt-button" data-variant="secondary" data-size="md" href={`/contratos/${summary.id}/relatorio`} prefetch={false}>Exportar histórico</Link>
            {summary.status === 'ACTIVE' ? <Link className="tt-button" data-variant="primary" data-size="md" href={`/cargas?contractId=${summary.id}`}>Abrir agenda de cargas</Link> : null}
          </div>
        </div>
        <dl className="entity-facts">
          <div><dt>Volume</dt><dd>{formatQuantity(summary.quantity_sc)} sc</dd></div>
          <div><dt>Preço de compra</dt><dd>{formatCurrency(summary.purchase_price_per_sc)} / sc</dd></div>
          <div><dt>Entrega</dt><dd>{formatDate(summary.delivery_start)} a {formatDate(summary.delivery_end)}</dd></div>
          <div><dt>Unidade</dt><dd>{unitLabel(summary.unit)}</dd></div>
          <div><dt>Política</dt><dd>Versão {summary.policy_version}</dd></div>
        </dl>
        <ol className="trace-rail" aria-label="Rastreabilidade do contrato">
          <TraceStep label="Negociação" value="Concluída" state="done" />
          <TraceStep label="Contrato" value={contractStatusLabel(summary.status)} state={summary.status === 'ACTIVE' || summary.status === 'CLOSED' ? 'done' : 'current'} />
          <TraceStep
            label="Execução física"
            value={summary.load_count > 0 ? `${summary.load_count} carga${summary.load_count === 1 ? '' : 's'}` : 'Não iniciada'}
            state={summary.load_count > 0 ? 'current' : 'future'}
          />
          <TraceStep label="Estoque" value="Sem movimento" state="future" />
          <TraceStep label="Liquidação" value="Não iniciada" state="future" />
          <TraceStep label="Contábil" value="Não iniciado" state="future" />
        </ol>
        <nav className="detail-tabs" aria-label="Seções do contrato">
          <a className="active" aria-current="page" href="#visao-geral">Visão geral</a>
          <Link href={`/cargas?contractId=${summary.id}`}>Entregas</Link>
          <a href="#termos-compra">Formalização</a>
          <a href="#obrigacoes">Obrigações</a>
          <a href="#custos-margem">Custos e margem</a>
          <a href="#documentos">Documentos e auditoria</a>
          <a href="#historico-contrato">Histórico</a>
        </nav>
      </header>

      <div className="contract-detail-layout" id="visao-geral">
        <div className="contract-main-column">
          <section className="detail-section" aria-labelledby="contract-conditions-title">
            <header><p className="section-kicker">CONDIÇÕES FORMALIZADAS</p><h2 id="contract-conditions-title">Condições comerciais</h2></header>
            <dl className="detail-data-grid">
              <div><dt>Commodity</dt><dd>{commodityLabel(summary.commodity)}</dd><small>Escopo do piloto</small></div>
              <div><dt>Quantidade contratada</dt><dd>{formatQuantity(summary.quantity_sc)} sc</dd><small>{unitLabel(summary.unit)}</small></div>
              <div><dt>Início da entrega</dt><dd>{formatDate(summary.delivery_start)}</dd></div>
              <div><dt>Fim da entrega</dt><dd>{formatDate(summary.delivery_end)}</dd></div>
            </dl>
          </section>

          <PurchaseTerms contractId={summary.id} terms={summary.purchase_terms} status={summary.status} />
          <ContractLifecycle contractId={summary.id} status={summary.status} />

          <ContractVersionHistory versions={versions} error={versionsError} />

          <section className="detail-section" id="custos-margem" aria-labelledby="contract-economics-title">
            <header><p className="section-kicker">ESTADO ECONÔMICO</p><h2 id="contract-economics-title">Custos e margem contratados</h2></header>
            <dl className="economic-ledger">
              <div><dt>Referência de venda</dt><dd>{formatCurrency(summary.sale_reference_per_sc)}</dd></div>
              <div><dt>Preço de compra</dt><dd>− {formatCurrency(summary.purchase_price_per_sc)}</dd></div>
              <div><dt>Custos diretos</dt><dd>− {formatCurrency(summary.total_costs_per_sc)}</dd></div>
              <div className="total"><dt>Margem projetada por saca</dt><dd>{formatCurrency(summary.projected_margin_per_sc)}</dd></div>
            </dl>
            <p className="detail-note">Valores preservados pela versão {summary.policy_version} da política aplicada na conversão da oferta.</p>
          </section>

          <div id="obrigacoes"><ContractObligations contractId={summary.id} obligations={summary.obligations} documents={documents} /></div>
          <DocumentPanel
            aggregateType="CONTRACT"
            aggregateId={summary.id}
            documents={documents}
            error={documentError}
            returnPath={`/contratos/${summary.id}`}
            sectionId="documentos"
            allowedDocumentTypes={['CONTRACT_DRAFT', 'SIGNED_CONTRACT', 'AMENDMENT', 'GUARANTEE', 'OTHER']}
          />
        </div>

        <aside className="contract-side-column" aria-label="Situação do contrato">
          <section>
            <p className="section-kicker">PRONTO PARA EXECUTAR?</p>
            <h2>{signed?.status === 'COMPLETED' && summary.purchase_terms && hasSignedDocument
              ? 'Contrato formalizado' : 'Formalização pendente'}</h2>
            <p>{!summary.purchase_terms
              ? 'Registre os termos do instrumento de compra e anexe o documento assinado antes de considerar a formalização concluída.'
              : !hasSignedDocument ? 'Anexe o documento assinado e conclua a obrigação correspondente para confirmar a formalização.'
                : 'A agenda operacional está conectada a este contrato. Acompanhe as cargas e as obrigações até a conclusão.'}</p>
            {summary.status === 'ACTIVE'
              ? <Link className="operational-link" href={`/cargas?contractId=${summary.id}`}>Abrir execução física <span aria-hidden="true">→</span></Link>
              : <p className="detail-note">A execução física será liberada após assinatura e ativação.</p>}
          </section>
          <section>
            <p className="section-kicker">OBJETOS RELACIONADOS</p>
            <dl className="linked-object-list">
              <div><dt>Contrato</dt><dd className="tt-mono">{summary.id}</dd></div>
              <div><dt>Cargas</dt><dd>{summary.load_count}</dd></div>
              <div><dt>Documentos</dt><dd>{documents.length}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}

function ContractVersionHistory({ versions, error }: { versions: ContractVersion[]; error: string | null }) {
  return <section className="detail-section" id="historico-contrato" aria-labelledby="contract-history-title">
    <header>
      <div><p className="section-kicker">RASTREABILIDADE</p><h2 id="contract-history-title">Histórico de versões</h2></div>
      <small>{versions.length} registro{versions.length === 1 ? '' : 's'} persistido{versions.length === 1 ? '' : 's'}</small>
    </header>
    {error ? <p className="detail-note" role="alert">{error}</p> : null}
    {!error && versions.length === 0 ? <p className="detail-note">Nenhuma versão registrada.</p> : null}
    {versions.length > 0 ? <ol className="contract-version-history">
      {versions.map((version) => <li key={version.version_number}>
        <span className="contract-version-number">v{version.version_number}</span>
        <div>
          <strong>{versionChangeLabel(version.change_type)}</strong>
          <span>{contractStatusLabel(version.lifecycle_status)}</span>
          {version.reason ? <p>{version.reason}</p> : null}
          <small>{formatDateTime(version.recorded_at)}{version.effective_on ? ` · vigência em ${formatDate(version.effective_on)}` : ''}</small>
        </div>
      </li>)}
    </ol> : null}
  </section>;
}

function versionChangeLabel(value: ContractVersion['change_type']): string {
  const labels: Record<ContractVersion['change_type'], string> = {
    CREATED: 'Contrato criado',
    TERMS_UPDATED: 'Termos atualizados',
    STATUS_TRANSITION: 'Status alterado',
    AMENDMENT: 'Aditivo formalizado',
  };
  return labels[value];
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC',
  }).format(new Date(value)) + ' UTC';
}

function TraceStep({ label, value, state }: { label: string; value: string; state: 'done' | 'current' | 'future' }) {
  return <li data-state={state}><span aria-hidden="true" /><div><strong>{label}</strong><small>{value}</small></div></li>;
}
