import { Button, Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { DemoLoadDetail } from './demo-load-detail';
import { currentUserContext } from '../../../lib/current-user';
import { commodityLabel, formatDate, loadContractSummary, type ContractSummary } from '../../../lib/contracts';
import { formatSchedule, formatWeightKg, loadLoadDetail, loadStatusLabel, type ScheduledLoad } from '../../../lib/loads';

export default async function LoadDetailPage({ params, searchParams }: {
  params: Promise<{ loadId: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const [{ loadId }, { modo }, user] = await Promise.all([params, searchParams, currentUserContext()]);
  if (modo === 'demonstracao') return <AppShell activeDomain="operations" userLabel={user.userLabel}><DemoLoadDetail loadId={loadId} /></AppShell>;

  const loadResult = await loadLoadDetail(loadId, user.identityHeaders);
  const contractResult = loadResult.data
    ? await loadContractSummary(loadResult.data.contractId, user.identityHeaders)
    : null;

  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      {loadResult.error ? <LoadError message={loadResult.error} /> : null}
      {contractResult?.error ? <LoadError message={contractResult.error} /> : null}
      {loadResult.data && contractResult?.summary ? <LoadDetail load={loadResult.data} summary={contractResult.summary} /> : null}
    </AppShell>
  );
}

function LoadError({ message }: { message: string }) {
  return <div className="feedback critical detail-feedback" role="alert"><strong>Não foi possível abrir a carga</strong><span>{message}</span><Link href="/cargas">Voltar à agenda</Link></div>;
}

function LoadDetail({ load, summary }: { load: ScheduledLoad; summary: ContractSummary }) {
  return (
    <>
      <header className="entity-header load-entity-header">
        <p className="breadcrumbs">Operações <span>›</span> <Link href={`/cargas?contractId=${summary.id}`}>Cargas</Link> <span>›</span> <span className="tt-mono">{load.id.slice(-8)}</span></p>
        <div className="entity-title-row">
          <div><p className="entity-kind">Carga de recebimento</p><h1>{load.vehiclePlate}</h1><p className="entity-id tt-mono">Carga {load.id}</p></div>
          <div className="entity-actions"><Status tone="positive">{loadStatusLabel(load.status)}</Status></div>
        </div>
        <dl className="entity-facts">
          <div><dt>Contrato</dt><dd><Link className="tt-mono" href={`/contratos/${summary.id}`}>{summary.id}</Link></dd></div>
          <div><dt>Commodity</dt><dd>{commodityLabel(summary.commodity)}</dd></div>
          <div><dt>Programação</dt><dd>{formatSchedule(load.scheduledAt, load.timezone)}</dd></div>
          <div><dt>Peso previsto</dt><dd>{formatWeightKg(load.expectedWeightKg)} kg</dd></div>
          <div><dt>Destino</dt><dd>{load.destinationCode}</dd></div>
        </dl>
        <ol className="trace-rail" aria-label="Etapas da carga">
          <TraceStep label="Programação" detail="Concluída" state="done" /><TraceStep label="Pesagem" /><TraceStep label="Classificação" /><TraceStep label="Romaneio" /><TraceStep label="NF-e" /><TraceStep label="Liquidação" />
        </ol>
      </header>

      <div className="load-detail-layout">
        <div className="load-main-column">
          <section className="detail-section load-programming-section">
            <header><div><p className="section-kicker">PROGRAMAÇÃO</p><h2>Dados previstos</h2></div><Status tone="positive">Saldo reservado</Status></header>
            <dl className="detail-data-grid">
              <div><dt>Data e horário</dt><dd>{formatSchedule(load.scheduledAt, load.timezone)}</dd></div><div><dt>Veículo</dt><dd>{load.vehiclePlate}</dd></div>
              <div><dt>Transportadora</dt><dd>{load.carrierName}</dd></div><div><dt>Destino</dt><dd>{load.destinationCode}</dd></div>
              <div><dt>Peso previsto</dt><dd>{formatWeightKg(load.expectedWeightKg)} kg</dd></div><div><dt>Janela do contrato</dt><dd>{formatDate(summary.delivery_start)} a {formatDate(summary.delivery_end)}</dd></div>
            </dl>
          </section>
          <UnavailableSection kicker="RECEBIMENTO" title="Pesagem" description="Peso bruto, tara e peso líquido aparecerão aqui após o registro da balança ou contingência manual." action="Registrar pesagem" />
          <UnavailableSection kicker="QUALIDADE" title="Classificação e desconto" description="Umidade, impureza, avariados, regra aplicada e memória do desconto dependerão da medição real da carga." action="Registrar classificação" />
        </div>

        <aside className="load-side-column" aria-label="Relações e histórico da carga">
          <section><p className="section-kicker">OBJETOS VINCULADOS</p><h2>Rastreabilidade</h2><dl className="linked-object-list">
            <div><dt>Contrato</dt><dd><Link className="tt-mono" href={`/contratos/${summary.id}`}>{summary.id}</Link></dd></div><div><dt>Romaneio</dt><dd>Ainda não existe</dd></div><div><dt>NF-e</dt><dd>Ainda não existe</dd></div><div><dt>Lote</dt><dd>Ainda não existe</dd></div><div><dt>Liquidação</dt><dd>Ainda não existe</dd></div>
          </dl></section>
          <section><p className="section-kicker">HISTÓRICO DA CARGA</p><h2>Eventos</h2><div className="load-history-item"><span aria-hidden="true" /><div><strong>Carga programada</strong><p>Saldo reservado no contrato para {formatWeightKg(load.expectedWeightKg)} kg.</p><small>{formatSchedule(load.createdAt, load.timezone)}</small></div></div></section>
        </aside>
      </div>
    </>
  );
}

function TraceStep({ label, detail = '—', state = 'future' }: { label: string; detail?: string; state?: 'done' | 'future' }) {
  return <li data-state={state}><span aria-hidden="true" /><div><strong>{label}</strong><small>{detail}</small></div></li>;
}

function UnavailableSection({ kicker, title, description, action }: { kicker: string; title: string; description: string; action: string }) {
  return <section className="detail-section unavailable-section"><header><div><p className="section-kicker">{kicker}</p><h2>{title}</h2></div><Button disabled title="Disponível na próxima etapa operacional.">{action}</Button></header><div className="section-empty-state"><span aria-hidden="true">＋</span><strong>{title} ainda não registrada</strong><p>{description}</p></div></section>;
}
