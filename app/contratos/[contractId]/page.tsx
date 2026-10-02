import { Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../../app-shell';
import { currentUserContext } from '../../../lib/current-user';
import {
  commodityLabel,
  contractStatusLabel,
  formatCurrency,
  formatDate,
  formatQuantity,
  loadContractSummary,
  obligationLabel,
  obligationStatus,
  unitLabel,
  type ContractSummary,
} from '../../../lib/contracts';

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const [{ contractId }, user] = await Promise.all([params, currentUserContext()]);
  const result = await loadContractSummary(contractId, user.identityHeaders);

  return (
    <AppShell activeDomain="contracts" userLabel={user.userLabel}>
      {result.error ? <ContractError message={result.error} /> : null}
      {result.summary ? <ContractDetail summary={result.summary} /> : null}
    </AppShell>
  );
}

function ContractError({ message }: { message: string }) {
  return (
    <>
      <header className="page-header">
        <p className="breadcrumbs">Contratos <span>›</span> Detalhe</p>
        <h1>Contrato indisponível</h1>
      </header>
      <div className="feedback critical detail-feedback" role="alert">
        <strong>Não foi possível abrir o contrato</strong>
        <span>{message}</span>
        <Link href="/contratos">Voltar aos contratos</Link>
      </div>
    </>
  );
}

function ContractDetail({ summary }: { summary: ContractSummary }) {
  const signed = summary.obligations.find((item) => item.code === 'SIGNED_CONTRACT');
  return (
    <>
      <header className="entity-header">
        <p className="breadcrumbs">Contratos <span>›</span> <span className="tt-mono">{summary.id}</span></p>
        <div className="entity-title-row">
          <div>
            <p className="entity-kind">Contrato de compra</p>
            <h1>{commodityLabel(summary.commodity)} · {formatQuantity(summary.quantity_sc)} sc</h1>
            <p className="entity-id tt-mono">{summary.id}</p>
          </div>
          <div className="entity-actions">
            <Status tone="positive">{contractStatusLabel(summary.status)}</Status>
            <Link className="tt-button" data-variant="primary" data-size="md" href={`/cargas?contractId=${summary.id}`}>Abrir agenda de cargas</Link>
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
          <TraceStep label="Contrato" value={contractStatusLabel(summary.status)} state="done" />
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
          <a href="#custos-margem">Custos e margem</a>
          <span aria-disabled="true">Documentos e auditoria</span>
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

          <section className="detail-section" aria-labelledby="contract-obligations-title">
            <header><p className="section-kicker">EXECUÇÃO</p><h2 id="contract-obligations-title">Obrigações para iniciar</h2></header>
            <div className="obligation-ledger" role="table" aria-label="Obrigações do contrato">
              <div className="obligation-ledger-head" role="row"><span role="columnheader">Obrigação</span><span role="columnheader">Status</span></div>
              {summary.obligations.map((item) => (
                <div className="obligation-ledger-row" role="row" key={item.code}>
                  <strong role="cell">{obligationLabel(item.code)}</strong>
                  <span role="cell"><Status tone={item.status === 'COMPLETED' ? 'positive' : 'warning'}>{obligationStatus(item.status)}</Status></span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="contract-side-column" aria-label="Situação do contrato">
          <section>
            <p className="section-kicker">PRONTO PARA EXECUTAR?</p>
            <h2>{signed?.status === 'COMPLETED' ? 'Contrato formalizado' : 'Assinatura pendente'}</h2>
            <p>A agenda operacional está conectada a este contrato. Cadastre e acompanhe as cargas enquanto as obrigações são concluídas.</p>
            <Link className="operational-link" href={`/cargas?contractId=${summary.id}`}>Abrir execução física <span aria-hidden="true">→</span></Link>
          </section>
          <section>
            <p className="section-kicker">OBJETOS RELACIONADOS</p>
            <dl className="linked-object-list">
              <div><dt>Contrato</dt><dd className="tt-mono">{summary.id}</dd></div>
              <div><dt>Cargas</dt><dd>{summary.load_count}</dd></div>
              <div><dt>Documentos</dt><dd>Backend pendente</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}

function TraceStep({ label, value, state }: { label: string; value: string; state: 'done' | 'current' | 'future' }) {
  return <li data-state={state}><span aria-hidden="true" /><div><strong>{label}</strong><small>{value}</small></div></li>;
}
