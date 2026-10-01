import { Button, Status } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { AppShell } from '../app-shell';
import { currentUserContext } from '../../lib/current-user';

type ContractSummary = {
  id: string;
  status: string;
  commodity: string;
  unit: string;
  quantity_sc: string;
  delivery_start: string;
  delivery_end: string;
  purchase_price_per_sc: string;
  projected_margin_per_sc: string;
  obligations: Array<{ code: string; status: string }>;
};

type ContractLoadResult =
  | { summary: ContractSummary; error: null }
  | { summary: null; error: string };

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const [{ contractId }, user] = await Promise.all([searchParams, currentUserContext()]);
  const result = contractId
    ? await loadContractSummary(contractId, user.identityHeaders)
    : null;

  return (
    <AppShell activeDomain="operations" userLabel={user.userLabel}>
      <header className="page-header loads-page-header">
        <p className="breadcrumbs">Operações <span>›</span> Agenda de cargas</p>
        <div className="page-header-row">
          <div>
            <p className="entity-kind">Execução física</p>
            <h1>Agenda de cargas</h1>
            <p className="page-description">Programe o recebimento e acompanhe a execução física a partir de contratos ativos.</p>
          </div>
          <span className="environment-label">Mountier Agro · ambiente inicial</span>
        </div>
      </header>

      {!contractId ? <NoContractSelected /> : null}
      {result?.error ? (
        <div className="feedback critical loads-feedback" role="alert">
          <strong>Não foi possível abrir o contrato</strong>
          <span>{result.error}</span>
          <Link href="/">Voltar ao Comercial</Link>
        </div>
      ) : null}
      {result?.summary ? <ContractLoadAgenda summary={result.summary} /> : null}
    </AppShell>
  );
}

function NoContractSelected() {
  return (
    <section className="loads-empty-state" aria-labelledby="loads-empty-title">
      <span className="loads-empty-mark" aria-hidden="true">CT</span>
      <p className="section-kicker">CONTRATO NECESSÁRIO</p>
      <h2 id="loads-empty-title">Selecione um contrato ativo</h2>
      <p>A agenda começa no contrato. Ative uma oferta no Comercial e use a ação “Abrir agenda de cargas” para manter a rastreabilidade.</p>
      <Link className="tt-button" data-variant="primary" data-size="md" href="/">Ir para ofertas</Link>
    </section>
  );
}

function ContractLoadAgenda({ summary }: { summary: ContractSummary }) {
  const obligationMap = new Map(summary.obligations.map((item) => [item.code, item.status]));
  return (
    <div className="loads-workspace">
      <section className="loads-contract-bar" aria-label="Contrato selecionado">
        <div>
          <span className="section-kicker">CONTRATO SELECIONADO</span>
          <strong className="tt-mono">{summary.id}</strong>
        </div>
        <dl>
          <div><dt>Commodity</dt><dd>{commodityLabel(summary.commodity)}</dd></div>
          <div><dt>Volume</dt><dd>{formatQuantity(summary.quantity_sc)} sc</dd></div>
          <div><dt>Janela contratual</dt><dd>{formatDate(summary.delivery_start)} a {formatDate(summary.delivery_end)}</dd></div>
          <div><dt>Status</dt><dd><Status tone="positive">{statusLabel(summary.status)}</Status></dd></div>
        </dl>
        <Link href="/">Voltar ao contrato comercial</Link>
      </section>

      <section className="loads-metrics" aria-label="Resumo da agenda">
        <article><span>Cargas programadas</span><strong>0</strong><small>Nenhuma programação registrada</small></article>
        <article><span>Volume programado</span><strong>0 <em>sc</em></strong><small>de {formatQuantity(summary.quantity_sc)} sc contratadas</small></article>
        <article><span>Volume recebido</span><strong>0 <em>sc</em></strong><small>A execução ainda não começou</small></article>
        <article><span>Janela disponível</span><strong>{daysBetween(summary.delivery_start, summary.delivery_end)}</strong><small>dias corridos no contrato</small></article>
      </section>

      <div className="loads-layout">
        <section className="loads-ledger" aria-labelledby="loads-ledger-title">
          <header>
            <div>
              <p className="section-kicker">PROGRAMAÇÃO OPERACIONAL</p>
              <h2 id="loads-ledger-title">Cargas do contrato</h2>
              <p>A agenda exibirá janela, veículo, transportadora, quantidade prevista e situação de cada carga.</p>
            </div>
            <Button disabled title="A programação será habilitada com o backend da segunda vertical slice.">Programar cargas</Button>
          </header>
          <div className="loads-table" role="table" aria-label="Cargas programadas">
            <div className="loads-table-head" role="row">
              <span role="columnheader">Carga</span><span role="columnheader">Janela</span><span role="columnheader">Veículo</span><span role="columnheader">Previsto</span><span role="columnheader">Status</span>
            </div>
            <div className="loads-table-empty">
              <span aria-hidden="true">＋</span>
              <strong>Nenhuma carga programada</strong>
              <p>A estrutura visual está pronta. A criação de agendas será habilitada junto das regras e contratos da segunda vertical slice.</p>
            </div>
          </div>
        </section>

        <aside className="loads-sidebar" aria-label="Pré-condições da execução">
          <section>
            <p className="section-kicker">PRÉ-CONDIÇÕES</p>
            <h2>Obrigações do contrato</h2>
            <div className="loads-obligations">
              {summary.obligations.map((item) => (
                <div key={item.code}>
                  <span>{obligationLabel(item.code)}</span>
                  <Status tone={item.status === 'COMPLETED' ? 'positive' : 'warning'}>{obligationStatus(item.status)}</Status>
                </div>
              ))}
            </div>
          </section>
          <section className="loads-next-step">
            <p className="section-kicker">PRÓXIMA ETAPA</p>
            <h2>Programação e execução</h2>
            <p>O próximo desenvolvimento ligará cada carga a este contrato e preservará saldo, pesagem, qualidade e trilha de auditoria.</p>
            <dl>
              <div><dt>Assinatura</dt><dd>{obligationStatus(obligationMap.get('CONTRACT_SIGNATURE'))}</dd></div>
              <div><dt>Agenda de entrega</dt><dd>{obligationStatus(obligationMap.get('DELIVERY_SCHEDULE'))}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

async function loadContractSummary(contractId: string, identityHeaders: Record<string, string>): Promise<ContractLoadResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { summary: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/contracts/${encodeURIComponent(contractId)}/summary`, {
      headers: identityHeaders,
      cache: 'no-store',
    });
    if (!response.ok) {
      return {
        summary: null,
        error: response.status === 404
          ? 'O contrato não existe ou não pertence ao tenant autenticado.'
          : 'A API não conseguiu carregar o resumo do contrato.',
      };
    }
    return { summary: await response.json() as ContractSummary, error: null };
  } catch {
    return { summary: null, error: 'Não foi possível acessar a API na porta configurada.' };
  }
}

function formatQuantity(value: string): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function daysBetween(start: string, end: string): number {
  return Math.max(1, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1);
}

function commodityLabel(value: string): string { return value === 'MILHO' ? 'Milho' : value; }
function statusLabel(value: string): string { return value === 'ACTIVE' ? 'Ativo' : value; }
function obligationLabel(value: string): string { return value === 'CONTRACT_SIGNATURE' ? 'Assinatura contratual' : value === 'DELIVERY_SCHEDULE' ? 'Agenda de entrega' : value; }
function obligationStatus(value?: string): string { return value === 'COMPLETED' ? 'Concluída' : value === 'PENDING' ? 'Pendente' : 'Não registrada'; }
