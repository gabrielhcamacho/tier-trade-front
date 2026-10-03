'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { FinanceWorkspace } from '../../lib/finance';
import { formatFinancialDate, formatMoney, titleStatusLabel } from '../../lib/finance';
import { DemoMetricStrip, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import {
  createTitleAction,
  reverseSettlementAction,
  settleTitleAction,
} from './actions';

const initialFinanceActionState = { ok: false, message: '' };

export function FinancialWorkspace({ data }: { data: FinanceWorkspace }) {
  const [titleState, titleAction, titlePending] = useActionState(createTitleAction, initialFinanceActionState);
  const [settlementState, settlementAction, settlementPending] = useActionState(settleTitleAction, initialFinanceActionState);
  const [reversalState, reversalAction, reversalPending] = useActionState(reverseSettlementAction, initialFinanceActionState);
  const salesEvents = data.events.filter((event) => event.direction === 'INFLOW');
  const payableEvents = data.events.filter((event) => event.direction === 'OUTFLOW');
  const issuable = salesEvents.filter((event) => !event.title && event.calculationStatus === 'READY');
  const openTitles = salesEvents.flatMap((event) => event.title && Number(event.title.outstandingAmount) > 0
    ? [{ event, title: event.title }] : []);
  const reversible = data.settlements.filter((settlement) => !settlement.reversedAt);
  const [selectedTitleId, setSelectedTitleId] = useState(openTitles[0]?.title.id ?? '');
  const selectedTitle = openTitles.find((item) => item.title.id === selectedTitleId);

  const forecastRows = salesEvents.map((event) => [
    <Link href={`/financeiro/liquidacoes/${event.id}`} key={event.id}>
      {event.dispatchDocumentReference}
    </Link>,
    event.beneficiaryName,
    event.contractReference,
    `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(event.quantityKg ?? 0))} kg`,
    event.calculatedAmount ? formatMoney(event.calculatedAmount) : 'Política pendente',
    event.title
      ? <DemoStatus tone={event.title.status === 'SETTLED' ? 'positive' : 'info'} key={`${event.id}-status`}>
          {titleStatusLabel(event.title.status)}
        </DemoStatus>
      : <DemoStatus tone="attention" key={`${event.id}-status`}>
          {event.calculationStatus === 'READY' ? 'Emitir título' : 'Definir arredondamento'}
        </DemoStatus>,
  ]);
  const titleRows = salesEvents.filter((event) => event.title).map((event) => {
    const title = event.title!;
    return [
      title.number,
      event.beneficiaryName,
      formatFinancialDate(title.dueDate),
      formatMoney(title.amount),
      formatMoney(title.adjustedAmount),
      formatMoney(title.settledAmount),
      formatMoney(title.outstandingAmount),
      <DemoStatus tone={title.status === 'SETTLED' ? 'positive' : title.status === 'PARTIALLY_SETTLED' ? 'info' : 'attention'} key={title.id}>
        {titleStatusLabel(title.status)}
      </DemoStatus>,
    ];
  });
  const payableRows = payableEvents.filter((event) => event.title).map((event) => {
    const title = event.title!;
    return [title.number, event.beneficiaryName, title.documentReference, formatFinancialDate(title.dueDate), formatMoney(title.amount), formatMoney(title.outstandingAmount), <DemoStatus tone="attention" key={title.id}>{titleStatusLabel(title.status)}</DemoStatus>];
  });
  const settlementRows = data.settlements.map((settlement) => [
    settlement.titleNumber,
    settlement.bankReference,
    formatFinancialDate(settlement.receivedAt),
    formatMoney(settlement.amount),
    settlement.reversedAt
      ? <DemoStatus key={settlement.id}>Estornado</DemoStatus>
      : <DemoStatus tone="positive" key={settlement.id}>Confirmado</DemoStatus>,
  ]);

  return (
    <>
      <DemoMetricStrip items={[
        { label: 'Previsto em vendas', value: formatMoney(data.summary.projectedAmount), detail: `${salesEvents.length} expedição(ões)` },
        { label: 'A receber', value: formatMoney(data.summary.receivableAmount), detail: `${openTitles.length} título(s) com saldo`, tone: 'primary' },
        { label: 'Recebido', value: formatMoney(data.summary.receivedAmount), detail: 'baixas ativas e rastreáveis' },
        { label: 'A pagar em tributos', value: formatMoney(data.summary.payableAmount), detail: `${payableEvents.length} obrigação(ões)`, tone: 'attention' },
      ]} />

      <DemoSection kicker="OPERAÇÃO FINANCEIRA" title="Emitir, receber e estornar" id="acoes" aside="ações salvas e auditadas">
        <div className="finance-action-grid">
          <form action={titleAction}>
            <p className="section-kicker">1 · PREVISÃO → TÍTULO</p>
            <h3>Emitir título a receber</h3>
            <Field label="Previsão pronta" required>
              <select name="financialEventId" defaultValue="" required>
                <option value="" disabled>Selecione</option>
                {issuable.map((event) => <option value={event.id} key={event.id}>
                  {event.contractReference} · {event.dispatchDocumentReference} · {formatMoney(event.calculatedAmount!)}
                </option>)}
              </select>
            </Field>
            <Field label="Número do título" required><input name="titleNumber" placeholder="TR-2026-0002" required /></Field>
            <Field label="Referência documental" hint="Vincula o título ao documento informado; não valida tributos." required>
              <input name="documentReference" placeholder="NF-000123" required />
            </Field>
            <Field label="Vencimento" required><input type="date" name="dueDate" required /></Field>
            <Feedback state={titleState} />
            <Button type="submit" disabled={titlePending || issuable.length === 0}>
              {titlePending ? 'Emitindo…' : 'Emitir título'}
            </Button>
          </form>

          <form action={settlementAction}>
            <p className="section-kicker">2 · TÍTULO → RECEBIMENTO</p>
            <h3>Registrar baixa</h3>
            <Field label="Título em aberto" required>
              <select name="titleId" value={selectedTitleId} onChange={(event) => setSelectedTitleId(event.target.value)} required>
                <option value="" disabled>Selecione</option>
                {openTitles.map(({ event, title }) => <option value={title.id} key={title.id}>
                  {title.number} · {event.beneficiaryName} · saldo {formatMoney(title.outstandingAmount)}
                </option>)}
              </select>
            </Field>
            <DecimalField name="amount" label="Valor recebido" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required />
            {selectedTitle ? <small className="finance-form-hint">Saldo disponível: {formatMoney(selectedTitle.title.outstandingAmount)}</small> : null}
            <Field label="Data e hora" required><input type="datetime-local" name="receivedAt" required /></Field>
            <Field label="Referência bancária" required><input name="bankReference" placeholder="PIX, extrato ou comprovante" required /></Field>
            <Field label="Observações"><textarea name="notes" rows={2} /></Field>
            <Feedback state={settlementState} />
            <Button type="submit" disabled={settlementPending || openTitles.length === 0}>
              {settlementPending ? 'Registrando…' : 'Registrar recebimento'}
            </Button>
          </form>

          <form action={reversalAction}>
            <p className="section-kicker">3 · CORREÇÃO CONTROLADA</p>
            <h3>Estornar recebimento</h3>
            <Field label="Baixa ativa" required>
              <select name="settlementId" defaultValue="" required>
                <option value="" disabled>Selecione</option>
                {reversible.map((settlement) => <option value={settlement.id} key={settlement.id}>
                  {settlement.titleNumber} · {settlement.bankReference} · {formatMoney(settlement.amount)}
                </option>)}
              </select>
            </Field>
            <Field label="Motivo do estorno" hint="O registro original permanece no histórico." required>
              <textarea name="reason" rows={4} minLength={3} maxLength={500} required />
            </Field>
            <Feedback state={reversalState} />
            <Button type="submit" disabled={reversalPending || reversible.length === 0}>
              {reversalPending ? 'Estornando…' : 'Confirmar estorno'}
            </Button>
          </form>
        </div>
      </DemoSection>

      <div className="demo-domain-layout finance-live-layout">
        <div className="demo-main-stack">
          <DemoSection kicker="PREVISÃO POR EXPEDIÇÃO" title="Eventos financeiros" id="liquidacoes" aside="contrato, expedição e cálculo">
            {forecastRows.length
              ? <DemoTable label="Previsões financeiras" columns={['Expedição', 'Cliente', 'Contrato', 'Quantidade', 'Valor bruto', 'Situação']} rows={forecastRows} />
              : <p>Nenhuma expedição gerou previsão financeira para este tenant.</p>}
          </DemoSection>
          <DemoSection kicker="DIREITOS" title="Contas a receber" id="receber" aside="títulos e saldo">
            {titleRows.length
              ? <DemoTable label="Contas a receber" columns={['Título', 'Cliente', 'Vencimento', 'Valor', 'Ajustes', 'Recebido', 'Saldo', 'Status']} rows={titleRows} />
              : <p>Nenhum título emitido.</p>}
          </DemoSection>
          <DemoSection kicker="OBRIGAÇÕES FISCAIS" title="Contas a pagar" id="pagar" aside="autoridade fiscal separada da contraparte comercial">
            {payableRows.length
              ? <DemoTable label="Contas a pagar" columns={['Título', 'Favorecido', 'Referência', 'Vencimento', 'Valor', 'Saldo', 'Status']} rows={payableRows} />
              : <p>Nenhum título fiscal a pagar.</p>}
          </DemoSection>
          <DemoSection kicker="CAIXA" title="Recebimentos e estornos" id="conciliacao" aside="referência bancária preservada">
            {settlementRows.length
              ? <DemoTable label="Baixas financeiras" columns={['Título', 'Referência', 'Data', 'Valor', 'Status']} rows={settlementRows} />
              : <p>Nenhum recebimento registrado.</p>}
          </DemoSection>
        </div>
        <aside className="demo-side-stack">
          <section><p className="section-kicker">RASTREABILIDADE</p><h2>Uma operação, uma história</h2><p>Contrato de venda, expedição, previsão, título e recebimento permanecem ligados pelo backend.</p></section>
          <section><p className="section-kicker">REGRA FINANCEIRA</p><h2>Sem arredondamento silencioso</h2><p>Valores que geram fração de centavo ficam bloqueados até existir uma política homologada para o tenant.</p></section>
          <section><p className="section-kicker">TRIBUTOS</p><h2>Dois favorecidos, dois fluxos</h2><p>Ajustes sobre o título comercial e pagamentos à autoridade fiscal são registrados separadamente, com origem na obrigação aceita.</p></section>
        </aside>
      </div>
    </>
  );
}

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  return state.message
    ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p>
    : null;
}
