import { Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../app-shell';
import { DemoLoadsAgenda } from './demo-loads';
import { LoadScheduler } from './load-scheduler';
import { currentUserContext } from '../../lib/current-user';
import {
  commodityLabel, contractStatusLabel, daysBetween, formatDate, formatQuantity,
  loadContractSummary, obligationLabel, obligationStatus, type ContractSummary,
} from '../../lib/contracts';
import {
  formatSchedule, formatWeightKg, loadContractLoads, loadStatusLabel, type LoadAgenda,
} from '../../lib/loads';

export default async function LoadsPage({ searchParams }: {
  searchParams: Promise<{ contractId?: string; modo?: string }>;
}) {
  const [{ contractId, modo }, user] = await Promise.all([searchParams, currentUserContext()]);
  if (modo === 'demonstracao') {
    return <AppShell activeDomain="operations" userLabel={user.userLabel}><DemoLoadsAgenda /></AppShell>;
  }
  const [contractResult, loadsResult] = contractId
    ? await Promise.all([
      loadContractSummary(contractId, user.identityHeaders),
      loadContractLoads(contractId, user.identityHeaders),
    ])
    : [null, null];

  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      <header className="page-header loads-page-header">
        <p className="breadcrumbs">Operações <span>›</span> Agenda de cargas</p>
        <div className="page-header-row">
          <div><p className="entity-kind">Execução física</p><h1>Agenda de cargas</h1><p className="page-description">Programe o recebimento e acompanhe a execução física a partir de contratos ativos.</p></div>
          <span className="environment-label">Mountier Agro · ambiente inicial</span>
        </div>
      </header>

      {!contractId ? <NoContractSelected /> : null}
      {contractResult?.error ? <LoadError message={contractResult.error} /> : null}
      {loadsResult?.error ? <LoadError message={loadsResult.error} /> : null}
      {contractResult?.summary && loadsResult?.data ? <ContractLoadAgenda summary={contractResult.summary} agenda={loadsResult.data} /> : null}
    </AppShell>
  );
}

function LoadError({ message }: { message: string }) {
  return <div className="feedback critical loads-feedback" role="alert"><strong>Não foi possível abrir o contrato</strong><span>{message}</span><Link href="/">Voltar ao Comercial</Link></div>;
}

function NoContractSelected() {
  return (
    <section className="loads-empty-state" aria-labelledby="loads-empty-title">
      <span className="loads-empty-mark" aria-hidden="true">CT</span><p className="section-kicker">CONTRATO NECESSÁRIO</p><h2 id="loads-empty-title">Selecione um contrato ativo</h2>
      <p>A agenda começa no contrato. Ative uma oferta no Comercial, abra o contrato e siga para a execução física sem perder a rastreabilidade.</p>
      <Link className="tt-button" data-variant="primary" data-size="md" href="/">Ir para ofertas</Link>
    </section>
  );
}

function ContractLoadAgenda({ summary, agenda }: { summary: ContractSummary; agenda: LoadAgenda }) {
  const obligationMap = new Map(summary.obligations.map((item) => [item.code, item.status]));
  const scheduledSc = String(Number(agenda.summary.scheduledWeightKg) / 60);
  const receivedSc = String(Number(agenda.summary.receivedWeightKg) / 60);
  return (
    <div className="loads-workspace">
      <section className="loads-contract-bar" aria-label="Contrato selecionado">
        <div><span className="section-kicker">CONTRATO SELECIONADO</span><strong className="tt-mono">{summary.id}</strong></div>
        <dl>
          <div><dt>Commodity</dt><dd>{commodityLabel(summary.commodity)}</dd></div><div><dt>Volume</dt><dd>{formatQuantity(summary.quantity_sc)} sc</dd></div>
          <div><dt>Janela contratual</dt><dd>{formatDate(summary.delivery_start)} a {formatDate(summary.delivery_end)}</dd></div><div><dt>Status</dt><dd><Status tone="positive">{contractStatusLabel(summary.status)}</Status></dd></div>
        </dl><Link href={`/contratos/${summary.id}`}>Abrir contrato</Link>
      </section>

      <section className="loads-metrics" aria-label="Resumo da agenda">
        <article><span>Cargas programadas</span><strong>{agenda.summary.count}</strong><small>{agenda.summary.count === 1 ? 'programação registrada' : 'programações registradas'}</small></article>
        <article><span>Volume programado</span><strong>{formatQuantity(scheduledSc)} <em>sc</em></strong><small>de {formatQuantity(summary.quantity_sc)} sc contratadas</small></article>
        <article><span>Volume recebido</span><strong>{formatQuantity(receivedSc)} <em>sc</em></strong><small>{Number(receivedSc) > 0 ? 'confirmadas na execução' : 'A execução ainda não começou'}</small></article>
        <article><span>Janela disponível</span><strong>{daysBetween(summary.delivery_start, summary.delivery_end)}</strong><small>dias corridos no contrato</small></article>
      </section>

      <div className="loads-layout">
        <section className="loads-ledger" aria-labelledby="loads-ledger-title">
          <header><div><p className="section-kicker">PROGRAMAÇÃO OPERACIONAL</p><h2 id="loads-ledger-title">Cargas do contrato</h2><p>Janela, veículo, transportadora, quantidade prevista e situação de cada carga.</p></div>
            <LoadScheduler contractId={summary.id} deliveryStart={summary.delivery_start} deliveryEnd={summary.delivery_end} />
          </header>
          <div className="loads-table" role="table" aria-label="Cargas programadas">
            <div className="loads-table-head" role="row"><span role="columnheader">Carga</span><span role="columnheader">Janela</span><span role="columnheader">Veículo</span><span role="columnheader">Previsto</span><span role="columnheader">Status</span></div>
            {agenda.items.length === 0 ? <div className="loads-table-empty"><span aria-hidden="true">＋</span><strong>Nenhuma carga programada</strong><p>Use “Programar carga” para reservar saldo e iniciar a execução do contrato.</p></div> : agenda.items.map((load) => (
              <Link className="loads-table-row" role="row" key={load.id} href={`/cargas/${load.id}`}>
                <span role="cell" className="tt-mono">{load.id.slice(0, 8)}</span><span role="cell">{formatSchedule(load.scheduledAt, load.timezone)}</span>
                <span role="cell"><strong>{load.vehiclePlate}</strong><small>{load.carrierName}</small></span><span role="cell">{formatWeightKg(load.expectedWeightKg)} kg</span>
                <span role="cell"><Status tone={load.status === 'CANCELLED' ? 'neutral' : 'positive'}>{loadStatusLabel(load.status)}</Status></span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="loads-sidebar" aria-label="Pré-condições da execução">
          <section><p className="section-kicker">PRÉ-CONDIÇÕES</p><h2>Obrigações do contrato</h2><div className="loads-obligations">{summary.obligations.map((item) => <div key={item.code}><span>{obligationLabel(item.code)}</span><Status tone={item.status === 'COMPLETED' ? 'positive' : 'warning'}>{obligationStatus(item.status)}</Status></div>)}</div></section>
          <section className="loads-next-step"><p className="section-kicker">PRÓXIMA ETAPA</p><h2>Recebimento e pesagem</h2><p>A programação já reserva o saldo contratual. A próxima entrega registrará bruto, tara, líquido e contingência da balança.</p><dl><div><dt>Assinatura</dt><dd>{obligationStatus(obligationMap.get('SIGNED_CONTRACT'))}</dd></div><div><dt>Agenda de entrega</dt><dd>{obligationStatus(obligationMap.get('DELIVERY_SCHEDULE'))}</dd></div></dl></section>
        </aside>
      </div>
    </div>
  );
}
