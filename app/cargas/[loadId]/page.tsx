import { Button, Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { DemoLoadDetail } from './demo-load-detail';
import { currentUserContext } from '../../../lib/current-user';
import {
  commodityLabel,
  formatDate,
  formatQuantity,
  loadContractSummary,
  type ContractSummary,
} from '../../../lib/contracts';

export default async function LoadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ loadId: string }>;
  searchParams: Promise<{ contractId?: string; modo?: string }>;
}) {
  const [{ loadId }, { contractId, modo }, user] = await Promise.all([params, searchParams, currentUserContext()]);
  if (modo === 'demonstracao') {
    return <AppShell activeDomain="operations" userLabel={user.userLabel}><DemoLoadDetail loadId={loadId} /></AppShell>;
  }
  const result = contractId ? await loadContractSummary(contractId, user.identityHeaders) : null;

  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      {!contractId ? <MissingContract /> : null}
      {result?.error ? <LoadError message={result.error} /> : null}
      {result?.summary ? <LoadUnavailableState loadId={loadId} summary={result.summary} /> : null}
    </AppShell>
  );
}

function MissingContract() {
  return (
    <section className="loads-empty-state" aria-labelledby="load-missing-contract-title">
      <span className="loads-empty-mark" aria-hidden="true">CG</span>
      <p className="section-kicker">VÍNCULO NECESSÁRIO</p>
      <h1 id="load-missing-contract-title">A carga precisa de um contrato</h1>
      <p>Abra o detalhe pela agenda contratual para preservar o tenant e o vínculo operacional.</p>
      <Link className="tt-button" data-variant="primary" data-size="md" href="/cargas">Voltar à agenda</Link>
    </section>
  );
}

function LoadError({ message }: { message: string }) {
  return <div className="feedback critical detail-feedback" role="alert"><strong>Não foi possível abrir a carga</strong><span>{message}</span><Link href="/cargas">Voltar à agenda</Link></div>;
}

function LoadUnavailableState({ loadId, summary }: { loadId: string; summary: ContractSummary }) {
  return (
    <>
      <header className="entity-header load-entity-header">
        <p className="breadcrumbs">Operações <span>›</span> Cargas <span>›</span> <span className="tt-mono">{loadId}</span></p>
        <div className="entity-title-row">
          <div>
            <p className="entity-kind">Carga de recebimento</p>
            <h1>Detalhe operacional indisponível</h1>
            <p className="entity-id tt-mono">Referência solicitada: {loadId}</p>
          </div>
          <div className="entity-actions">
            <Status tone="neutral">Não registrada</Status>
            <Button disabled title="A criação e consulta de cargas depende do backend da próxima vertical slice.">Registrar carga</Button>
          </div>
        </div>
        <dl className="entity-facts">
          <div><dt>Contrato</dt><dd className="tt-mono">{summary.id}</dd></div>
          <div><dt>Commodity</dt><dd>{commodityLabel(summary.commodity)}</dd></div>
          <div><dt>Volume contratado</dt><dd>{formatQuantity(summary.quantity_sc)} sc</dd></div>
          <div><dt>Janela contratual</dt><dd>{formatDate(summary.delivery_start)} a {formatDate(summary.delivery_end)}</dd></div>
          <div><dt>Situação</dt><dd>Sem registro de carga</dd></div>
        </dl>
        <ol className="trace-rail" aria-label="Etapas da carga">
          <TraceStep label="Programação" />
          <TraceStep label="Pesagem" />
          <TraceStep label="Classificação" />
          <TraceStep label="Romaneio" />
          <TraceStep label="NF-e" />
          <TraceStep label="Liquidação" />
        </ol>
      </header>

      <div className="load-detail-layout">
        <div className="load-main-column">
          <div className="availability-banner" role="status"><strong>Ações indisponíveis nesta etapa</strong><span>O contrato é real, mas a entidade de carga ainda não existe na API. Nenhuma informação operacional foi simulada.</span></div>
          <UnavailableSection kicker="RECEBIMENTO" title="Pesagem" description="Peso bruto, tara e peso líquido aparecerão aqui após o registro da balança ou contingência manual." action="Registrar pesagem" />
          <UnavailableSection kicker="QUALIDADE" title="Classificação e desconto" description="Umidade, impureza, avariados, regra aplicada e memória do desconto dependerão da medição real da carga." action="Registrar classificação" />
        </div>

        <aside className="load-side-column" aria-label="Relações e histórico da carga">
          <section>
            <p className="section-kicker">OBJETOS VINCULADOS</p>
            <h2>Rastreabilidade</h2>
            <dl className="linked-object-list">
              <div><dt>Contrato</dt><dd><Link className="tt-mono" href={`/contratos/${summary.id}`}>{summary.id}</Link></dd></div>
              <div><dt>Romaneio</dt><dd>Ainda não existe</dd></div>
              <div><dt>NF-e</dt><dd>Ainda não existe</dd></div>
              <div><dt>Lote</dt><dd>Ainda não existe</dd></div>
              <div><dt>Liquidação</dt><dd>Ainda não existe</dd></div>
            </dl>
          </section>
          <section>
            <p className="section-kicker">HISTÓRICO DA CARGA</p>
            <h2>Eventos</h2>
            <p className="empty-history">Sem eventos registrados. O histórico será alimentado pela trilha de auditoria da carga.</p>
          </section>
        </aside>
      </div>
    </>
  );
}

function TraceStep({ label }: { label: string }) {
  return <li data-state="future"><span aria-hidden="true" /><div><strong>{label}</strong><small>—</small></div></li>;
}

function UnavailableSection({ kicker, title, description, action }: { kicker: string; title: string; description: string; action: string }) {
  return (
    <section className="detail-section unavailable-section">
      <header><div><p className="section-kicker">{kicker}</p><h2>{title}</h2></div><Button disabled title="Disponível quando o backend de cargas for implementado.">{action}</Button></header>
      <div className="section-empty-state"><span aria-hidden="true">＋</span><strong>{title} ainda não registrada</strong><p>{description}</p></div>
    </section>
  );
}
