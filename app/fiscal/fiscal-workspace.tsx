'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useActionState } from 'react';
import type {
  FiscalConfiguration, FiscalDocument, FiscalEstablishment, FiscalTaxComponent, FiscalWorkspace,
} from '../../lib/fiscal';
import { formatFiscalDate, formatFiscalMoney } from '../../lib/fiscal';
import { DemoMetricStrip, DemoSection, DemoStatus, DemoTable } from '../demo-ui';
import {
  activateFiscalConfigurationAction, createFiscalConfigurationAction, createFiscalDocumentAction,
  createFiscalEstablishmentAction, newFiscalConfigurationVersionAction, rejectFiscalDocumentAction,
  updateFiscalConfigurationAction, updateFiscalDocumentAction, updateFiscalEstablishmentAction,
  validateFiscalDocumentAction,
} from './actions';

const initialState = { ok: false, message: '' };

export function FiscalWorkspaceView({ data }: { data: FiscalWorkspace }) {
  const [createState, createAction, createPending] = useActionState(createFiscalDocumentAction, initialState);
  const [establishmentState, establishmentAction, establishmentPending] = useActionState(
    createFiscalEstablishmentAction, initialState,
  );
  const [configurationState, configurationAction, configurationPending] = useActionState(
    createFiscalConfigurationAction, initialState,
  );
  const readyEvents = data.eligibleEvents.filter((event) => event.calculationStatus === 'READY');
  const rows = data.documents.map((document) => [
    document.documentNumber,
    document.counterpartyName,
    document.contractReference,
    document.dispatchReference,
    formatFiscalMoney(document.totalAmount),
    <DemoStatus tone={statusTone(document.status)} key={document.id}>{statusLabel(document.status)}</DemoStatus>,
    document.title?.number ?? 'Não vinculado',
  ]);

  return (
    <>
      <DemoMetricStrip items={[
        { label: 'Em conferência', value: String(data.summary.received), detail: 'documentos recebidos', tone: data.summary.received ? 'attention' : undefined },
        { label: 'Validados', value: String(data.summary.validated), detail: 'integridade confirmada', tone: 'primary' },
        { label: 'Rejeitados', value: String(data.summary.rejected), detail: 'histórico preservado' },
        { label: 'Títulos vinculados', value: String(data.summary.linkedTitles), detail: 'cadeia fiscal-financeira' },
      ]} />

      <div className="fiscal-configuration-layout">
        <DemoSection kicker="ESTABELECIMENTOS" title="Cadastro fiscal do tenant" id="estabelecimentos" aside="dados persistidos e isolados por tenant">
          <form action={establishmentAction} className="fiscal-establishment-form">
            <Field label="Razão social" required><input name="legalName" placeholder="Razão social do estabelecimento" required /></Field>
            <Field label="CNPJ" hint="Somente números" required><input name="taxId" inputMode="numeric" pattern="[0-9]{14}" maxLength={14} required /></Field>
            <Field label="Inscrição estadual"><input name="stateRegistration" /></Field>
            <Field label="UF" required><input name="uf" maxLength={2} pattern="[A-Za-z]{2}" required /></Field>
            <Field label="Regime tributário" required>
              <select name="taxRegime" defaultValue="" required>
                <option value="" disabled>Selecione</option>
                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
              </select>
            </Field>
            <div className="fiscal-entry-action"><Feedback state={establishmentState} /><Button type="submit" disabled={establishmentPending}>{establishmentPending ? 'Salvando…' : 'Cadastrar estabelecimento'}</Button></div>
          </form>
          <div className="fiscal-establishment-list">
            {data.establishments.map((establishment) => <FiscalEstablishmentEditor
              establishment={establishment} key={establishment.id}
            />)}
          </div>
        </DemoSection>

        <DemoSection kicker="CATÁLOGO VERSIONADO" title="Nova configuração fiscal" id="configuracoes" aside="rascunho até ativação explícita">
          <form action={configurationAction} className="fiscal-configuration-form">
            <ConfigurationFields establishments={data.establishments} />
            <div className="fiscal-entry-action"><Feedback state={configurationState} /><Button type="submit" disabled={configurationPending || data.establishments.length === 0}>{configurationPending ? 'Criando…' : 'Criar versão em rascunho'}</Button></div>
          </form>
        </DemoSection>
      </div>

      {data.configurations.map((configuration) => <FiscalConfigurationEditor
        configuration={configuration} establishments={data.establishments} key={configuration.id}
      />)}

      <DemoSection kicker="ENTRADA FISCAL" title="Registrar NF-e de saída" id="entrada" aside="salva no backend e isolada por tenant">
        <form action={createAction} className="fiscal-entry-form">
          <Field label="Expedição com evento financeiro" required>
            <select name="financialEventId" defaultValue="" required>
              <option value="" disabled>Selecione</option>
              {readyEvents.map((event) => <option key={event.id} value={event.id}>
                {event.contractReference} · {event.dispatchReference} · {formatFiscalMoney(event.expectedAmount)}
              </option>)}
            </select>
          </Field>
          <Field label="Número da NF-e" required><input name="documentNumber" placeholder="NFE-000123" required /></Field>
          <Field label="Chave de acesso" hint="44 dígitos; obrigatória para validar.">
            <input name="accessKey" inputMode="numeric" pattern="[0-9]{44}" maxLength={44} placeholder="Digite os 44 dígitos" />
          </Field>
          <Field label="Emissão" required><input type="datetime-local" name="issuedAt" required /></Field>
          <DecimalField name="totalAmount" label="Valor total" prefix="R$" defaultValue="0" fractionDigits={2} emptyWhenZero required />
          <Field label="Observações de conferência"><textarea name="validationNotes" rows={2} /></Field>
          <div className="fiscal-entry-action">
            <Feedback state={createState} />
            <Button type="submit" disabled={createPending || readyEvents.length === 0}>
              {createPending ? 'Registrando…' : 'Registrar documento'}
            </Button>
          </div>
        </form>
      </DemoSection>

      <div className="demo-domain-layout fiscal-live-layout">
        <div className="demo-main-stack">
          <DemoSection kicker="REGISTRO FISCAL" title="Documentos e vínculos" id="documentos" aside="expedição → contrato → financeiro">
            {rows.length
              ? <DemoTable label="Documentos fiscais" columns={['Documento', 'Cliente', 'Contrato', 'Expedição', 'Valor', 'Status', 'Título']} rows={rows} />
              : <p>Nenhum documento fiscal recebido para este tenant.</p>}
          </DemoSection>
          {data.documents.map((document) => <FiscalDocumentEditor document={document} key={document.id} />)}
        </div>
        <aside className="demo-side-stack">
          <section><p className="section-kicker">VALIDAÇÃO</p><h2>Conferência sem inferência</h2><p>A validação exige chave de acesso e igualdade exata com o evento financeiro da expedição.</p></section>
          <section><p className="section-kicker">TRIBUTOS</p><h2>{data.taxCalculation.status === 'BLOCKED_ENGINE' ? 'Configuração ativa' : 'Configuração pendente'}</h2>{data.taxCalculation.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}</section>
          <section><p className="section-kicker">RASTREABILIDADE</p><h2>Cadeia preservada</h2><p>Documento, expedição, contrato, previsão e título permanecem ligados por identificadores persistidos.</p></section>
        </aside>
      </div>
    </>
  );
}

function FiscalEstablishmentEditor({ establishment }: { establishment: FiscalEstablishment }) {
  const [state, action, pending] = useActionState(updateFiscalEstablishmentAction, initialState);
  return <article className="fiscal-establishment-editor">
    <div>
      <strong>{establishment.legalName}</strong>
      <span>{formatTaxId(establishment.taxId)} · {establishment.uf}</span>
      <span>{establishment.taxRegime ? taxRegimeLabel(establishment.taxRegime) : 'Regime pendente'}</span>
    </div>
    <form action={action}>
      <input type="hidden" name="establishmentId" value={establishment.id} />
      <Field label="Razão social" required><input name="legalName" defaultValue={establishment.legalName} required /></Field>
      <Field label="CNPJ" required><input name="taxId" inputMode="numeric" pattern="[0-9]{14}" maxLength={14} defaultValue={establishment.taxId} required /></Field>
      <Field label="Inscrição estadual"><input name="stateRegistration" defaultValue={establishment.stateRegistration ?? ''} /></Field>
      <Field label="UF" required><input name="uf" maxLength={2} pattern="[A-Za-z]{2}" defaultValue={establishment.uf} required /></Field>
      <Field label="Regime tributário" required>
        <select name="taxRegime" defaultValue={establishment.taxRegime ?? ''} required>
          <option value="" disabled>Selecione</option>
          <option value="SIMPLES_NACIONAL">Simples Nacional</option>
          <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
          <option value="LUCRO_REAL">Lucro Real</option>
        </select>
      </Field>
      <div className="fiscal-entry-action"><Feedback state={state} /><Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar estabelecimento'}</Button></div>
    </form>
  </article>;
}

function FiscalConfigurationEditor({ configuration, establishments }: {
  configuration: FiscalConfiguration; establishments: FiscalEstablishment[];
}) {
  const [editState, editAction, editPending] = useActionState(updateFiscalConfigurationAction, initialState);
  const [activateState, activateAction, activatePending] = useActionState(
    activateFiscalConfigurationAction, initialState,
  );
  const [versionState, versionAction, versionPending] = useActionState(
    newFiscalConfigurationVersionAction, initialState,
  );
  const draft = configuration.status === 'DRAFT';
  return (
    <DemoSection
      kicker={`CONFIGURAÇÃO · V${configuration.version}`}
      title={configuration.name}
      aside={`${configurationStatusLabel(configuration.status)} · ${configuration.establishmentName ?? 'estabelecimento pendente'}`}
    >
      <div className="fiscal-configuration-card">
        <dl className="summary-ledger">
          <div><dt>Origem</dt><dd>{configuration.establishmentUf ?? 'Pendente'}</dd></div>
          <div><dt>Destino</dt><dd>{configuration.destinationUf ?? 'Pendente'}</dd></div>
          <div><dt>CFOP</dt><dd>{configuration.cfop ?? 'Pendente'}</dd></div>
          <div><dt>Tratamentos</dt><dd>{configuration.taxComponents.length}</dd></div>
        </dl>
        {draft ? <form action={editAction} className="fiscal-configuration-form">
          <input type="hidden" name="configurationId" value={configuration.id} />
          <ConfigurationFields establishments={establishments} configuration={configuration} />
          <div className="fiscal-entry-action"><Feedback state={editState} /><Button type="submit" disabled={editPending}>{editPending ? 'Salvando…' : 'Salvar rascunho'}</Button></div>
        </form> : <FiscalConfigurationSummary configuration={configuration} />}
        <div className="fiscal-configuration-actions">
          {draft ? <form action={activateAction}>
            <input type="hidden" name="configurationId" value={configuration.id} />
            <Feedback state={activateState} />
            <Button type="submit" disabled={activatePending}>{activatePending ? 'Ativando…' : 'Ativar versão'}</Button>
          </form> : null}
          {configuration.status !== 'DRAFT' ? <form action={versionAction}>
            <input type="hidden" name="configurationId" value={configuration.id} />
            <Feedback state={versionState} />
            <Button type="submit" disabled={versionPending}>{versionPending ? 'Criando…' : 'Criar nova versão'}</Button>
          </form> : null}
        </div>
      </div>
    </DemoSection>
  );
}

function ConfigurationFields({ establishments, configuration }: {
  establishments: FiscalEstablishment[]; configuration?: FiscalConfiguration;
}) {
  return <>
    <Field label="Nome da configuração" required><input name="configurationName" defaultValue={configuration?.name ?? ''} required /></Field>
    <Field label="Estabelecimento" required>
      <select name="establishmentId" defaultValue={configuration?.establishmentId ?? ''} required>
        <option value="" disabled>Selecione</option>
        {establishments.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.legalName} · {item.uf}</option>)}
      </select>
    </Field>
    <Field label="Commodity" required><input name="commodity" defaultValue={configuration?.commodity ?? 'MILHO'} required /></Field>
    <Field label="UF de destino" required><input name="destinationUf" maxLength={2} pattern="[A-Za-z]{2}" defaultValue={configuration?.destinationUf ?? ''} required /></Field>
    <Field label="CFOP" hint="Quatro dígitos homologados" required><input name="cfop" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={configuration?.cfop ?? ''} required /></Field>
    <Field label="Estratégia de emissão" required>
      <select name="emissionStrategy" defaultValue={configuration?.emissionStrategy ?? ''} required>
        <option value="" disabled>Selecione</option>
        <option value="INTEGRATED">Integrada a emissor externo</option>
        <option value="NATIVE">Emissão nativa</option>
      </select>
    </Field>
    <Field label="Responsável técnico" required><input name="technicalResponsible" defaultValue={configuration?.technicalResponsible ?? ''} required /></Field>
    <Field label="Início da vigência" required><input type="date" name="effectiveFrom" defaultValue={configuration?.effectiveFrom ?? ''} required /></Field>
    <Field label="Fim da vigência"><input type="date" name="effectiveTo" defaultValue={configuration?.effectiveTo ?? ''} /></Field>
    <div className="fiscal-tax-components">
      <p className="section-kicker">TRATAMENTOS TRIBUTÁRIOS</p>
      {(['ICMS', 'PIS', 'COFINS', 'FUNRURAL'] as const).map((tax) => <TaxComponentFields
        tax={tax} component={configuration?.taxComponents.find((item) => item.tax === tax)} key={tax}
      />)}
    </div>
  </>;
}

function TaxComponentFields({ tax, component }: { tax: FiscalTaxComponent['tax']; component?: FiscalTaxComponent }) {
  const key = tax.toLowerCase();
  return <div className="fiscal-tax-row">
    <strong>{tax}</strong>
    <Field label="Tratamento">
      <select name={`${key}Treatment`} defaultValue={component?.treatment ?? ''}>
        <option value="">Não configurado</option>
        <option value="TAXED">Tributado</option>
        <option value="EXEMPT">Isento</option>
        <option value="NON_TAXED">Não tributado</option>
        <option value="DEFERRED">Diferido</option>
        <option value="SUSPENDED">Suspenso</option>
      </select>
    </Field>
    <DecimalField name={`${key}RatePct`} label="Alíquota" suffix="%" defaultValue={component?.ratePct ?? '0'} fractionDigits={6} emptyWhenZero />
    <label className="fiscal-retention"><input type="checkbox" name={`${key}Retained`} defaultChecked={component?.retained ?? false} /> Retido</label>
  </div>;
}

function FiscalConfigurationSummary({ configuration }: { configuration: FiscalConfiguration }) {
  return <div className="fiscal-configuration-summary">
    <p><strong>Vigência:</strong> {configuration.effectiveFrom ?? 'Pendente'} até {configuration.effectiveTo ?? 'sem término'}</p>
    <p><strong>Emissão:</strong> {configuration.emissionStrategy === 'NATIVE' ? 'Nativa' : 'Integrada'}</p>
    <p><strong>Responsável:</strong> {configuration.technicalResponsible}</p>
    <ul>{configuration.taxComponents.map((component) => <li key={component.tax}>
      {component.tax}: {taxTreatmentLabel(component.treatment)}{component.ratePct ? ` · ${component.ratePct}%` : ''}{component.retained ? ' · retido' : ''}
    </li>)}</ul>
  </div>;
}

function FiscalDocumentEditor({ document }: { document: FiscalDocument }) {
  const [editState, editAction, editPending] = useActionState(updateFiscalDocumentAction, initialState);
  const [validateState, validateAction, validatePending] = useActionState(validateFiscalDocumentAction, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectFiscalDocumentAction, initialState);
  return (
    <DemoSection kicker="CONFERÊNCIA" title={document.documentNumber} aside={`${document.contractReference} · ${document.counterpartyName}`}>
      <div className="fiscal-document-card">
        <dl className="summary-ledger">
          <div><dt>Valor informado</dt><dd>{formatFiscalMoney(document.totalAmount)}</dd></div>
          <div><dt>Valor esperado</dt><dd>{formatFiscalMoney(document.expectedAmount)}</dd></div>
          <div><dt>Diferença</dt><dd>{formatFiscalMoney(document.differenceAmount)}</dd></div>
          <div><dt>Última atualização</dt><dd>{formatFiscalDate(document.updatedAt)}</dd></div>
        </dl>
        <form action={editAction} className="fiscal-edit-form">
          <input type="hidden" name="documentId" value={document.id} />
          <Field label="Número" required><input name="documentNumber" defaultValue={document.documentNumber} required /></Field>
          <Field label="Chave de acesso"><input name="accessKey" inputMode="numeric" pattern="[0-9]{44}" maxLength={44} defaultValue={document.accessKey ?? ''} /></Field>
          <Field label="Emissão" required><input type="datetime-local" name="issuedAt" defaultValue={toLocalInput(document.issuedAt)} required /></Field>
          <DecimalField name="totalAmount" label="Valor total" prefix="R$" defaultValue={document.totalAmount} fractionDigits={2} required />
          <Field label="Observações"><textarea name="validationNotes" rows={2} defaultValue={document.validationNotes ?? ''} /></Field>
          <div className="fiscal-entry-action"><Feedback state={editState} /><Button type="submit" disabled={editPending}>{editPending ? 'Salvando…' : 'Salvar correção'}</Button></div>
        </form>
        <div className="fiscal-decision-grid">
          <form action={validateAction}>
            <input type="hidden" name="documentId" value={document.id} />
            <Feedback state={validateState} />
            <Button type="submit" disabled={validatePending || document.status === 'VALIDATED'}>{validatePending ? 'Validando…' : 'Validar e vincular título'}</Button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="documentId" value={document.id} />
            <Field label="Motivo da rejeição" required><textarea name="reason" minLength={3} maxLength={500} rows={2} required /></Field>
            <Feedback state={rejectState} />
            <Button type="submit" disabled={rejectPending}>{rejectPending ? 'Rejeitando…' : 'Rejeitar documento'}</Button>
          </form>
        </div>
      </div>
    </DemoSection>
  );
}

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className="fulfillment-feedback" data-ok={state.ok || undefined}>{state.message}</p> : null;
}

function toLocalInput(value: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: 'America/Sao_Paulo',
  }).format(new Date(value)).replace(' ', 'T');
}

function statusLabel(status: FiscalDocument['status']): string {
  if (status === 'VALIDATED') return 'Validado';
  if (status === 'REJECTED') return 'Rejeitado';
  return 'Em conferência';
}

function statusTone(status: FiscalDocument['status']): 'positive' | 'critical' | 'attention' {
  if (status === 'VALIDATED') return 'positive';
  if (status === 'REJECTED') return 'critical';
  return 'attention';
}

function formatTaxId(value: string): string {
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function taxRegimeLabel(value: NonNullable<FiscalEstablishment['taxRegime']>): string {
  if (value === 'SIMPLES_NACIONAL') return 'Simples Nacional';
  if (value === 'LUCRO_PRESUMIDO') return 'Lucro Presumido';
  return 'Lucro Real';
}

function configurationStatusLabel(status: FiscalConfiguration['status']): string {
  if (status === 'ACTIVE') return 'Ativa';
  if (status === 'RETIRED') return 'Encerrada';
  return 'Rascunho';
}

function taxTreatmentLabel(treatment: FiscalTaxComponent['treatment']): string {
  const labels: Record<FiscalTaxComponent['treatment'], string> = {
    TAXED: 'Tributado', EXEMPT: 'Isento', NON_TAXED: 'Não tributado',
    DEFERRED: 'Diferido', SUSPENDED: 'Suspenso',
  };
  return labels[treatment];
}
