'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { FinanceWorkspace } from '../../lib/finance';
import { formatFinancialDate, formatMoney, payableStatusLabel, titleStatusLabel } from '../../lib/finance';
import { DemoMetricStrip, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import { EmptyState } from '../page-state';
import {
  approvePaymentBatchAction,
  accrueCommissionAction,
  configureFinancePolicyAction,
  createCommissionPolicyAction,
  createBankAccountAction,
  createBankStatementEntryAction,
  createPaymentBatchAction,
  createPurchaseCostComponentAction,
  createTitleAction,
  executePaymentBatchAction,
  importBankStatementAction,
  payTitleAction,
  reconcileBankStatementEntryAction,
  reversePaymentAction,
  reverseSettlementAction,
  settleTitleAction,
  submitPaymentBatchAction,
} from './actions';

const initialFinanceActionState = { ok: false, message: '' };

export function FinancialWorkspace({ data }: { data: FinanceWorkspace }) {
  const [titleState, titleAction, titlePending] = useActionState(createTitleAction, initialFinanceActionState);
  const [settlementState, settlementAction, settlementPending] = useActionState(settleTitleAction, initialFinanceActionState);
  const [reversalState, reversalAction, reversalPending] = useActionState(reverseSettlementAction, initialFinanceActionState);
  const [paymentState, paymentAction, paymentPending] = useActionState(payTitleAction, initialFinanceActionState);
  const [paymentReversalState, paymentReversalAction, paymentReversalPending] = useActionState(reversePaymentAction, initialFinanceActionState);
  const [componentState, componentAction, componentPending] = useActionState(createPurchaseCostComponentAction, initialFinanceActionState);
  const [policyState, policyAction, policyPending] = useActionState(configureFinancePolicyAction, initialFinanceActionState);
  const [batchState, batchAction, batchPending] = useActionState(createPaymentBatchAction, initialFinanceActionState);
  const [submitState, submitAction, submitPending] = useActionState(submitPaymentBatchAction, initialFinanceActionState);
  const [approveState, approveAction, approvePending] = useActionState(approvePaymentBatchAction, initialFinanceActionState);
  const [executeState, executeAction, executePending] = useActionState(executePaymentBatchAction, initialFinanceActionState);
  const [accountState, accountAction, accountPending] = useActionState(createBankAccountAction, initialFinanceActionState);
  const [entryState, entryAction, entryPending] = useActionState(createBankStatementEntryAction, initialFinanceActionState);
  const [importState, importAction, importPending] = useActionState(importBankStatementAction, initialFinanceActionState);
  const [reconcileState, reconcileAction, reconcilePending] = useActionState(reconcileBankStatementEntryAction, initialFinanceActionState);
  const [commissionPolicyState, commissionPolicyAction, commissionPolicyPending] = useActionState(createCommissionPolicyAction, initialFinanceActionState);
  const [commissionState, commissionAction, commissionPending] = useActionState(accrueCommissionAction, initialFinanceActionState);
  const salesEvents = data.events.filter((event) => event.direction === 'INFLOW');
  const payableEvents = data.events.filter((event) => event.direction === 'OUTFLOW');
  const issuable = salesEvents.filter((event) => !event.title && event.calculationStatus === 'READY');
  const openTitles = salesEvents.flatMap((event) => event.title && Number(event.title.outstandingAmount) > 0
    ? [{ event, title: event.title }] : []);
  const reversible = data.settlements.filter((settlement) => !settlement.reversedAt);
  const openPayables = payableEvents.flatMap((event) => event.title && Number(event.title.outstandingAmount) > 0
    ? [{ event, title: event.title }] : []);
  const reversiblePayments = data.payments.filter((payment) => !payment.reversedAt);
  const purchasePayables = payableEvents.filter((event) => event.eventType === 'PURCHASE_RECEIPT_PAYABLE' && event.title);
  const draftBatches = data.governance.paymentBatches.filter((batch) => batch.status === 'DRAFT');
  const pendingBatches = data.governance.paymentBatches.filter((batch) => batch.status === 'PENDING_APPROVAL');
  const approvedBatches = data.governance.paymentBatches.filter((batch) => batch.status === 'APPROVED');
  const unmatchedEntries = data.governance.bankStatementEntries.filter((entry) => entry.status === 'UNMATCHED');
  const activeCommissionPolicies = data.governance.commissionPolicies.filter((policy) => policy.status === 'ACTIVE');
  const commissionableEvents = data.events.filter((event) => event.calculationStatus === 'READY' && event.expectedOn);
  const [selectedTitleId, setSelectedTitleId] = useState(openTitles[0]?.title.id ?? '');
  const selectedTitle = openTitles.find((item) => item.title.id === selectedTitleId);
  const [selectedPayableId, setSelectedPayableId] = useState(openPayables[0]?.title.id ?? '');
  const selectedPayable = openPayables.find((item) => item.title.id === selectedPayableId);

  const forecastRows = salesEvents.map((event) => [
    <Link href={`/financeiro/liquidacoes/${event.id}`} key={event.id}>
      {event.dispatchDocumentReference}
    </Link>,
    event.beneficiaryName,
    `${event.contractReference ?? 'Sem contrato'} · v${event.salesContractVersionNumber ?? event.purchaseContractVersionNumber ?? '—'}`,
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
    return [title.number, event.beneficiaryName, title.documentReference, formatFinancialDate(title.dueDate), formatMoney(title.amount), formatMoney(title.settledAmount), formatMoney(title.outstandingAmount), <DemoStatus tone={title.status === 'SETTLED' ? 'positive' : title.status === 'PARTIALLY_SETTLED' ? 'info' : 'attention'} key={title.id}>{payableStatusLabel(title.status)}</DemoStatus>];
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
  const paymentRows = data.payments.map((payment) => [
    payment.titleNumber,
    payment.beneficiaryName,
    payment.bankReference,
    formatFinancialDate(payment.paidAt),
    formatMoney(payment.amount),
    payment.reversedAt
      ? <DemoStatus key={payment.id}>Estornado</DemoStatus>
      : <DemoStatus tone="positive" key={payment.id}>Confirmado</DemoStatus>,
  ]);

  return (
    <>
      <DemoMetricStrip items={[
        { label: 'Previsto em vendas', value: formatMoney(data.summary.projectedAmount), detail: `${salesEvents.length} expedição(ões)` },
        { label: 'A receber', value: formatMoney(data.summary.receivableAmount), detail: `${openTitles.length} título(s) com saldo`, tone: 'primary' },
        { label: 'Contas a pagar', value: formatMoney(data.summary.payableAmount), detail: `${openPayables.length} título(s) com saldo`, tone: 'attention' },
        { label: 'Fluxo líquido realizado', value: formatMoney(data.summary.netCashFlowAmount), detail: `${formatMoney(data.summary.receivedAmount)} recebido − ${formatMoney(data.summary.paidAmount)} pago · não é saldo bancário` },
      ]} />

      <DemoSection kicker="MARGEM OPERACIONAL REALIZADA" title="Receita expedida menos aquisição e componentes da compra" id="margem-realizada" aside="visão gerencial; não é margem líquida contábil">
        <DemoMetricStrip items={[
          { label: 'Receita expedida', value: formatMoney(data.governance.realizedMargin.revenueAmount), detail: 'expedições com cálculo financeiro pronto; não significa recebido' },
          { label: 'Custo operacional apropriado', value: formatMoney(data.governance.realizedMargin.totalCostAmount), detail: 'aquisição rateada + componentes ativos da compra' },
          { label: 'Margem operacional realizada', value: formatMoney(data.governance.realizedMargin.realizedMarginAmount), detail: data.governance.realizedMargin.status === 'COMPLETE' ? 'escopo operacional calculado; não é fechamento contábil' : 'aguardando compra e venda conectadas', tone: 'primary' },
        ]} />
        <p className="finance-form-hint">Inclui receita expedida, aquisição apropriada e componentes ativos da compra. Não inclui, nesta versão, tributos e despesas da venda, comissões, despesas administrativas nem fechamento contábil.</p>
        {data.governance.realizedMargin.byCommodity.length ? <DemoTable label="Margem operacional realizada por commodity"
          columns={['Commodity', 'Receita', 'Aquisição', 'Componentes', 'Custo total', 'Margem', 'Expedido']}
          rows={data.governance.realizedMargin.byCommodity.map((row) => [row.commodity, formatMoney(row.revenueAmount),
            formatMoney(row.acquisitionCostAmount), formatMoney(row.componentImpactAmount), formatMoney(row.totalCostAmount),
            formatMoney(row.realizedMarginAmount), `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(row.dispatchedKg))} kg`])} /> : null}
      </DemoSection>

      <DemoSection kicker="COMPOSIÇÃO DA COMPRA" title="Qualidade, frete, armazenagem e retenções" id="composicao-compra" aside="regras configuradas, nunca presumidas">
        <div className="finance-action-grid">
          <form action={componentAction}>
            <Field label="Título de compra" required><select name="financialEventId" defaultValue="" required><option value="" disabled>Selecione</option>
              {purchasePayables.map((event) => <option value={event.id} key={event.id}>{event.title!.number} · {event.beneficiaryName}</option>)}</select></Field>
            <Field label="Componente" required><select name="componentType" defaultValue="QUALITY_DISCOUNT"><option value="QUALITY_DISCOUNT">Desconto de qualidade</option><option value="FREIGHT">Frete</option><option value="STORAGE">Armazenagem</option><option value="TAX_WITHHOLDING">Retenção</option><option value="OTHER">Outro</option></select></Field>
            <Field label="Efeito no título" required><select name="payableImpact" defaultValue="REDUCE_PAYABLE"><option value="REDUCE_PAYABLE">Reduz a pagar</option><option value="INCREASE_PAYABLE">Aumenta a pagar</option><option value="MEMO_ONLY">Somente memória</option></select></Field>
            <DecimalField name="amount" label="Valor" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required />
            <Field label="Descrição" required><input name="description" placeholder="Motivo e base documental" required /></Field>
            <Field label="Referência"><input name="externalReference" placeholder="Laudo, CTe ou documento" /></Field>
            <Feedback state={componentState} /><Button type="submit" disabled={componentPending || purchasePayables.length === 0}>{componentPending ? 'Registrando…' : 'Registrar componente'}</Button>
          </form>
          <div>{data.governance.purchaseCostComponents.length
            ? <DemoTable label="Componentes da compra" columns={['Título', 'Tipo', 'Efeito', 'Valor', 'Descrição', 'Status']}
              rows={data.governance.purchaseCostComponents.map((item) => [item.title_number, item.component_type, item.payable_impact,
                formatMoney(item.amount), item.description, item.reversed_at ? 'Estornado' : 'Ativo'])} />
            : <EmptyState compact eyebrow="SEM COMPONENTES" title="Nenhum custo ou desconto adicional" description="Registre somente frete, qualidade, armazenagem ou retenções respaldados por regra e documento." />}</div>
        </div>
      </DemoSection>

      <DemoSection kicker="COMISSIONAMENTO" title="Políticas e apropriações" id="comissoes" aside="base, vigência e taxa preservadas por versão">
        <div className="finance-action-grid">
          <form action={commissionPolicyAction}>
            <h3>Nova versão da política</h3>
            <Field label="Código" required><input name="code" placeholder="CORRETOR_MILHO" pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,39}" required /></Field>
            <Field label="Nome" required><input name="name" placeholder="Comissão corretagem milho" required /></Field>
            <Field label="Favorecido" required><input name="beneficiaryName" placeholder="Pessoa ou empresa comissionada" required /></Field>
            <Field label="Commodity"><select name="commodity" defaultValue=""><option value="">Todas</option><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></Field>
            <DecimalField name="ratePct" label="Taxa" suffix="%" defaultValue="0" fractionDigits={6} emptyWhenZero required />
            <Field label="Início da vigência" required><input type="date" name="effectiveFrom" required /></Field>
            <Field label="Fim da vigência"><input type="date" name="effectiveTo" /></Field>
            <Field label="Situação" required><select name="status" defaultValue="DRAFT"><option value="DRAFT">Rascunho</option><option value="ACTIVE">Ativa</option></select></Field>
            <Feedback state={commissionPolicyState} />
            <Button type="submit" disabled={commissionPolicyPending}>{commissionPolicyPending ? 'Salvando…' : 'Salvar política'}</Button>
          </form>
          <form action={commissionAction}>
            <h3>Apropriar comissão</h3>
            <Field label="Política ativa" required><select name="policyId" defaultValue="" required><option value="" disabled>Selecione</option>{activeCommissionPolicies.map((policy) => <option value={policy.id} key={policy.id}>{policy.code} · v{policy.version} · {Number(policy.rate_pct).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}%</option>)}</select></Field>
            <Field label="Evento financeiro" required><select name="financialEventId" defaultValue="" required><option value="" disabled>Selecione</option>{commissionableEvents.map((event) => <option value={event.id} key={event.id}>{event.contractReference ?? event.sourceId} · {event.beneficiaryName} · {formatMoney(event.calculatedAmount ?? event.rawAmount ?? 0)}</option>)}</select></Field>
            <p className="finance-form-hint">O backend confere commodity, vigência, duplicidade e precisão antes de apropriar.</p>
            <Feedback state={commissionState} />
            <Button type="submit" disabled={commissionPending || activeCommissionPolicies.length === 0 || commissionableEvents.length === 0}>{commissionPending ? 'Calculando…' : 'Calcular e apropriar'}</Button>
          </form>
          <div><h3>Políticas cadastradas</h3>{data.governance.commissionPolicies.length
            ? <DemoTable label="Políticas de comissão" columns={['Código', 'Versão', 'Favorecido', 'Commodity', 'Taxa', 'Status']}
              rows={data.governance.commissionPolicies.map((policy) => [policy.code, `v${policy.version}`, policy.beneficiary_name, policy.commodity ?? 'Todas', `${Number(policy.rate_pct).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}%`, policy.status])} />
            : <EmptyState compact eyebrow="SEM POLÍTICA" title="Nenhuma política de comissão cadastrada" description="Crie uma versão para calcular comissão sobre uma base financeira persistida." />}</div>
        </div>
        {data.governance.commissionAccruals.length ? <DemoTable label="Comissões apropriadas" columns={['Política', 'Evento', 'Base', 'Comissão', 'Status', 'Data']}
          rows={data.governance.commissionAccruals.map((item) => [item.policy_code, item.financial_event_id, formatMoney(item.basis_amount), formatMoney(item.commission_amount), item.status, formatFinancialDate(item.created_at)])} /> : null}
      </DemoSection>

      <DemoSection kicker="GOVERNANÇA FINANCEIRA" title="Alçadas e lotes de pagamento" id="lotes" aside="política versionada e quatro olhos">
        <div className="finance-action-grid">
          <form action={policyAction}><h3>Política de aprovação</h3>
            <DecimalField name="paymentApprovalThreshold" label="Aprovação obrigatória acima de" prefix="R$" defaultValue={data.governance.activePolicy?.payment_approval_threshold ?? '0'} fractionDigits={2} required />
            <Feedback state={policyState} /><Button type="submit" disabled={policyPending}>{policyPending ? 'Salvando…' : 'Versionar política'}</Button>
          </form>
          <form action={batchAction}><h3>Novo lote</h3><Field label="Referência" required><input name="reference" placeholder="PG-2026-0001" required /></Field>
            <Field label="Agendamento" required><input type="date" name="scheduledOn" required /></Field>
            <Field label="Título" required><select name="titleId" defaultValue="" required><option value="" disabled>Selecione</option>{openPayables.map(({ event, title }) => <option value={title.id} key={title.id}>{title.number} · {event.beneficiaryName} · {formatMoney(title.outstandingAmount)}</option>)}</select></Field>
            <DecimalField name="amount" label="Valor do lote" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required />
            <Feedback state={batchState} /><Button type="submit" disabled={batchPending || openPayables.length === 0}>{batchPending ? 'Criando…' : 'Criar lote'}</Button>
          </form>
          <div><h3>Fluxo de aprovação</h3>
            <BatchAction title="Enviar rascunho" batches={draftBatches} action={submitAction} state={submitState} pending={submitPending} />
            <BatchAction title="Aprovar pendente" batches={pendingBatches} action={approveAction} state={approveState} pending={approvePending} />
            <BatchAction title="Executar aprovado" batches={approvedBatches} action={executeAction} state={executeState} pending={executePending} />
          </div>
        </div>
        {data.governance.paymentBatches.length ? <DemoTable label="Lotes de pagamento" columns={['Referência', 'Data', 'Total', 'Status', 'Política']}
          rows={data.governance.paymentBatches.map((batch) => [batch.reference, formatFinancialDate(batch.scheduled_on), formatMoney(batch.total_amount), batch.status, batch.policy_version ? `v${batch.policy_version}` : 'Não aplicada'])} /> : null}
      </DemoSection>

      <DemoSection kicker="CONCILIAÇÃO" title="Extrato e movimentos financeiros" id="conciliacao-bancaria" aside="valor e direção conferidos pelo backend">
        <div className="finance-action-grid">
          <form action={accountAction}><h3>Conta bancária</h3><Field label="Código" required><input name="code" placeholder="BB01" required /></Field><Field label="Nome" required><input name="name" placeholder="Banco do Brasil · operacional" required /></Field><Feedback state={accountState} /><Button type="submit" disabled={accountPending}>{accountPending ? 'Salvando…' : 'Cadastrar conta'}</Button></form>
          <form action={importAction} encType="multipart/form-data"><h3>Importar extrato CSV</h3><Field label="Conta" required><select name="bankAccountId" defaultValue="" required><option value="" disabled>Selecione</option>{data.governance.bankAccounts.map((account) => <option value={account.id} key={account.id}>{account.code} · {account.name}</option>)}</select></Field><Field label="Arquivo CSV" hint="Até 1.000 linhas e 2 MB." required><input type="file" name="statementFile" accept=".csv,text/csv" required /></Field><p className="finance-form-hint">Colunas obrigatórias: data, direção, valor e referência. Descrição é opcional.</p><Link className="text-link" href="/financeiro/modelo-extrato">Baixar modelo CSV</Link><Feedback state={importState} /><Button type="submit" disabled={importPending || data.governance.bankAccounts.length === 0}>{importPending ? 'Importando…' : 'Importar extrato'}</Button></form>
          <form action={entryAction}><h3>Lançamento manual</h3><Field label="Conta" required><select name="bankAccountId" defaultValue="" required><option value="" disabled>Selecione</option>{data.governance.bankAccounts.map((account) => <option value={account.id} key={account.id}>{account.code} · {account.name}</option>)}</select></Field><Field label="Direção" required><select name="direction" defaultValue="CREDIT"><option value="CREDIT">Crédito</option><option value="DEBIT">Débito</option></select></Field><DecimalField name="amount" label="Valor" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required /><Field label="Data e hora" required><input type="datetime-local" name="occurredAt" required /></Field><Field label="Referência" required><input name="bankReference" required /></Field><Field label="Descrição"><input name="description" /></Field><Feedback state={entryState} /><Button type="submit" disabled={entryPending || data.governance.bankAccounts.length === 0}>{entryPending ? 'Salvando…' : 'Salvar lançamento'}</Button></form>
          <form action={reconcileAction}><h3>Conciliar</h3><Field label="Lançamento" required><select name="entryId" defaultValue="" required><option value="" disabled>Selecione</option>{unmatchedEntries.map((entry) => <option value={entry.id} key={entry.id}>{entry.bank_account_code} · {entry.bank_reference} · {formatMoney(entry.amount)}</option>)}</select></Field><Field label="Tipo" required><select name="matchedType" defaultValue="SETTLEMENT"><option value="SETTLEMENT">Recebimento</option><option value="PAYMENT">Pagamento</option></select></Field><Field label="Movimento" required><select name="matchedId" defaultValue="" required><option value="" disabled>Selecione</option>{reversible.map((item) => <option value={item.id} key={item.id}>Recebimento · {item.bankReference} · {formatMoney(item.amount)}</option>)}{reversiblePayments.map((item) => <option value={item.id} key={item.id}>Pagamento · {item.bankReference} · {formatMoney(item.amount)}</option>)}</select></Field><Feedback state={reconcileState} /><Button type="submit" disabled={reconcilePending || unmatchedEntries.length === 0}>{reconcilePending ? 'Conciliando…' : 'Conciliar movimento'}</Button></form>
        </div>
        {data.governance.bankStatementImports.length ? <DemoTable label="Histórico de importações" columns={['Arquivo', 'Conta', 'Formato', 'Importados', 'Ignorados', 'Data']}
          rows={data.governance.bankStatementImports.map((item) => [item.original_file_name, item.bank_account_code, item.source_format, item.imported_count, item.skipped_count, formatFinancialDate(item.created_at)])} /> : <EmptyState compact eyebrow="SEM IMPORTAÇÃO" title="Nenhum extrato importado" description="Use o modelo CSV para registrar lotes idempotentes e auditáveis." />}
        {data.governance.bankStatementEntries.length ? <DemoTable label="Lançamentos bancários" columns={['Conta', 'Referência', 'Direção', 'Valor', 'Data', 'Origem', 'Status']}
          rows={data.governance.bankStatementEntries.map((item) => [item.bank_account_code, item.bank_reference, item.direction === 'CREDIT' ? 'Crédito' : 'Débito', formatMoney(item.amount), formatFinancialDate(item.occurred_at), item.import_id ? `Arquivo · linha ${item.source_line_number}` : 'Manual', item.status])} /> : null}
      </DemoSection>

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

      <DemoSection kicker="CONTAS A PAGAR" title="Pagar e estornar obrigações" id="acoes-pagar" aside="fornecedor ou autoridade e caixa atualizados juntos">
        <div className="finance-action-grid">
          <form action={paymentAction}>
            <p className="section-kicker">1 · OBRIGAÇÃO → PAGAMENTO</p>
            <h3>Registrar pagamento</h3>
            <Field label="Título a pagar em aberto" required>
              <select name="titleId" value={selectedPayableId} onChange={(event) => setSelectedPayableId(event.target.value)} required>
                <option value="" disabled>Selecione</option>
                {openPayables.map(({ event, title }) => <option value={title.id} key={title.id}>
                  {title.number} · {event.beneficiaryName} · saldo {formatMoney(title.outstandingAmount)}
                </option>)}
              </select>
            </Field>
            <DecimalField name="amount" label="Valor pago" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required />
            {selectedPayable ? <small className="finance-form-hint">Saldo disponível: {formatMoney(selectedPayable.title.outstandingAmount)}</small> : null}
            <Field label="Data e hora" required><input type="datetime-local" name="paidAt" required /></Field>
            <Field label="Referência bancária" required><input name="bankReference" placeholder="PIX, extrato ou comprovante" required /></Field>
            <Field label="Observações"><textarea name="notes" rows={2} /></Field>
            <Feedback state={paymentState} />
            <Button type="submit" disabled={paymentPending || openPayables.length === 0}>
              {paymentPending ? 'Registrando…' : 'Registrar pagamento'}
            </Button>
          </form>

          <form action={paymentReversalAction}>
            <p className="section-kicker">2 · CORREÇÃO CONTROLADA</p>
            <h3>Estornar pagamento</h3>
            <Field label="Pagamento ativo" required>
              <select name="paymentId" defaultValue="" required>
                <option value="" disabled>Selecione</option>
                {reversiblePayments.map((payment) => <option value={payment.id} key={payment.id}>
                  {payment.titleNumber} · {payment.bankReference} · {formatMoney(payment.amount)}
                </option>)}
              </select>
            </Field>
            <Field label="Motivo do estorno" hint="O pagamento original permanece no histórico." required>
              <textarea name="reason" rows={4} minLength={3} maxLength={500} required />
            </Field>
            <Feedback state={paymentReversalState} />
            <Button type="submit" disabled={paymentReversalPending || reversiblePayments.length === 0}>
              {paymentReversalPending ? 'Estornando…' : 'Confirmar estorno'}
            </Button>
          </form>
        </div>
      </DemoSection>

      <div className="demo-domain-layout finance-live-layout">
        <div className="demo-main-stack">
          <DemoSection kicker="PREVISÃO POR EXPEDIÇÃO" title="Eventos financeiros" id="liquidacoes" aside="contrato, expedição e cálculo">
            {forecastRows.length
              ? <DemoTable label="Previsões financeiras" columns={['Expedição', 'Cliente', 'Contrato', 'Quantidade', 'Valor bruto', 'Situação']} rows={forecastRows} rowHrefs={salesEvents.map((event) => `/financeiro/liquidacoes/${event.id}`)} />
              : <EmptyState compact eyebrow="SEM PREVISÕES" title="Nenhuma expedição gerou previsão financeira" description="Expedições de venda confirmadas aparecem aqui antes da emissão do título." action={{ href: '/estoque', label: 'Abrir execução de venda' }} />}
          </DemoSection>
          <DemoSection kicker="DIREITOS" title="Contas a receber" id="receber" aside="títulos e saldo">
            {titleRows.length
              ? <DemoTable label="Contas a receber" columns={['Título', 'Cliente', 'Vencimento', 'Valor', 'Ajustes', 'Recebido', 'Saldo', 'Status']} rows={titleRows} />
              : <EmptyState compact eyebrow="SEM RECEBÍVEIS" title="Nenhum título a receber emitido" description="Emita o título a partir de uma previsão pronta para iniciar a liquidação." />}
          </DemoSection>
          <DemoSection kicker="OBRIGAÇÕES" title="Contas a pagar" id="pagar" aside="fornecedores e autoridades identificados pela origem">
            {payableRows.length
              ? <DemoTable label="Contas a pagar" columns={['Título', 'Favorecido', 'Referência', 'Vencimento', 'Valor', 'Pago', 'Saldo', 'Status']} rows={payableRows} />
              : <EmptyState compact eyebrow="SEM PAGÁVEIS" title="Nenhum título a pagar emitido" description="Títulos de compra e tributos aparecem após a validação das respectivas origens." action={{ href: '/fiscal', label: 'Abrir Fiscal' }} />}
          </DemoSection>
          <DemoSection kicker="CAIXA" title="Recebimentos e estornos" id="conciliacao" aside="referência bancária preservada">
            {settlementRows.length
              ? <DemoTable label="Baixas financeiras" columns={['Título', 'Referência', 'Data', 'Valor', 'Status']} rows={settlementRows} />
              : <EmptyState compact eyebrow="SEM RECEBIMENTOS" title="Nenhuma baixa de cliente registrada" description="Selecione um título em aberto para registrar uma baixa auditável." />}
          </DemoSection>
          <DemoSection kicker="CAIXA" title="Pagamentos fiscais e estornos" id="pagamentos" aside="referência bancária preservada">
            {paymentRows.length
              ? <DemoTable label="Pagamentos fiscais" columns={['Título', 'Favorecido', 'Referência', 'Data', 'Valor', 'Status']} rows={paymentRows} />
              : <EmptyState compact eyebrow="SEM PAGAMENTOS" title="Nenhum pagamento registrado" description="Selecione um título a pagar em aberto para registrar ou incluir em lote." />}
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
    ? <p className="fulfillment-feedback" data-ok={state.ok || undefined} role={state.ok ? 'status' : 'alert'} aria-live={state.ok ? 'polite' : 'assertive'}>{state.message}</p>
    : null;
}

function BatchAction({ title, batches, action, state, pending }: {
  title: string;
  batches: FinanceWorkspace['governance']['paymentBatches'];
  action: (payload: FormData) => void;
  state: { ok: boolean; message: string };
  pending: boolean;
}) {
  return <form action={action} className="finance-inline-action">
    <Field label={title} required><select name="batchId" defaultValue="" required><option value="" disabled>Selecione</option>
      {batches.map((batch) => <option value={batch.id} key={batch.id}>{batch.reference} · {formatMoney(batch.total_amount)}</option>)}
    </select></Field>
    <Feedback state={state} />
    <Button type="submit" disabled={pending || batches.length === 0}>{pending ? 'Processando…' : title}</Button>
  </form>;
}
