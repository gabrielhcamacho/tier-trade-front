'use client';

import { Button, DecimalField, Field, FormSection, Status, normalizeDecimalInput } from '@mountier/tier-trade-design-system';
import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { hasSupabaseConfiguration } from '../lib/supabase/configuration';

type OfferResult = {
  offerId: string;
  status: string;
  scenarioVersion?: number;
  pricing: { totalCostsPerSc: string; projectedMarginPerSc: string };
  policyVersion: number;
};
type SubmissionResult = { offerId: string; status: string; decision: string; approvalId?: string };
type ContractResult = { contractId: string; offerId: string; status: string };
type ContractSummary = { id: string; status: string; obligations: Array<{ code: string; status: string }> };
type OfferDetail = OfferResult & {
  counterpartyId: string; commodity: Commodity; unit: 'SC_60KG'; quantitySc: string;
  deliveryStart: string; deliveryEnd: string; purchasePricePerSc: string;
  saleReferencePerSc: string; costs: Array<{ code: string; amountPerSc: string }>;
  approval: { id: string; status: string } | null; contractId: string | null;
};
type MarginPolicy = {
  policyId?: string;
  commodity: string;
  version: number;
  autoApprovalMarginPerSc: string;
  absoluteFloorMarginPerSc: string;
};
type Commodity = 'MILHO' | 'SOJA';
type PartyType = 'PERSON' | 'COMPANY' | 'COOPERATIVE' | 'UNCLASSIFIED';
type Counterparty = {
  id: string; legalName: string; partyType: PartyType;
  taxIdLength?: number; taxIdLast4?: string; taxId?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export function OfferWorkspace({ initialOfferId }: { initialOfferId?: string }) {
  const router = useRouter();
  const [offer, setOffer] = useState<OfferResult | null>(null);
  const [detail, setDetail] = useState<OfferDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [contract, setContract] = useState<ContractResult | null>(null);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [commodity, setCommodity] = useState<Commodity>('MILHO');
  const [policies, setPolicies] = useState<Partial<Record<Commodity, MarginPolicy>>>({});
  const [counterparties, setCounterparties] = useState<Counterparty[] | null>(null);
  const [counterpartyId, setCounterpartyId] = useState('');
  const [showCounterpartyForm, setShowCounterpartyForm] = useState(false);
  const [profileType, setProfileType] = useState<'PERSON' | 'COMPANY' | 'COOPERATIVE'>('COMPANY');
  const [formResetKey, setFormResetKey] = useState(0);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>('bootstrap');
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [bootstrapFailed, setBootstrapFailed] = useState(false);
  const authConfigured = hasSupabaseConfiguration();
  const developmentTenantId = process.env.NEXT_PUBLIC_DEV_TENANT_ID;
  const envReady = Boolean(apiUrl && (authConfigured
    || (developmentTenantId && process.env.NEXT_PUBLIC_DEV_ACTOR_ID)));
  const policy = policies[commodity] ?? null;
  const selectedCounterparty = counterparties?.find((item) => item.id === counterpartyId);

  async function identityHeaders(): Promise<Record<string, string>> {
    if (authConfigured) {
      const { data } = await createClient().auth.getSession();
      if (!data.session?.access_token) throw new Error('Sessão expirada. Entre novamente.');
      return { authorization: `Bearer ${data.session.access_token}` };
    }
    if (!developmentTenantId) throw new Error('Tenant local não configurado.');
    return {
      'x-tenant-id': developmentTenantId,
      'x-actor-id': process.env.NEXT_PUBLIC_DEV_ACTOR_ID ?? '',
    };
  }

  async function request<T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' = 'POST', body?: object): Promise<T> {
    const identity = await identityHeaders();
    let response: Response;
    try {
      response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: body ? { ...identity, 'content-type': 'application/json' } : identity,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Não foi possível acessar a API. Confirme se o backend está em execução na porta 3001.');
    }
    const raw = await response.text();
    const payload = raw ? JSON.parse(raw) : null;
    if (!response.ok) {
      const code = payload?.code ?? payload?.message;
      throw new Error(readableError(code));
    }
    return payload as T;
  }

  useEffect(() => {
    let active = true;
    if (!envReady) { setPending(null); return; }
    async function bootstrap() {
      setError(null);
      setBootstrapFailed(false);
      setPending('bootstrap');
      try {
        const [loadedCounterparties, cornPolicy, soyPolicy, loadedDetail] = await Promise.all([
          request<Counterparty[]>('/v1/counterparties', 'GET'),
          request<MarginPolicy | null>('/v1/settings/margin-policy/MILHO', 'GET'),
          request<MarginPolicy | null>('/v1/settings/margin-policy/SOJA', 'GET'),
          initialOfferId ? request<OfferDetail>(`/v1/offers/${initialOfferId}`, 'GET') : Promise.resolve(null),
        ]);
        if (!active) return;
        setCounterparties(loadedCounterparties);
        setPolicies({ ...(cornPolicy ? { MILHO: cornPolicy } : {}), ...(soyPolicy ? { SOJA: soyPolicy } : {}) });
        if (loadedDetail) {
          setDetail(loadedDetail);
          setOffer(loadedDetail);
          setCommodity(loadedDetail.commodity);
          setCounterpartyId(loadedDetail.counterpartyId);
          if (loadedDetail.approval) setSubmission({ offerId: loadedDetail.offerId,
            status: loadedDetail.status, decision: 'APPROVAL_REQUIRED',
            approvalId: loadedDetail.approval.id });
          if (loadedDetail.contractId) {
            setContract({ contractId: loadedDetail.contractId, offerId: loadedDetail.offerId, status: 'ACTIVE' });
            const loadedSummary = await request<ContractSummary>(`/v1/contracts/${loadedDetail.contractId}/summary`, 'GET');
            if (active) setSummary(loadedSummary);
          }
        } else if (loadedCounterparties.length === 1) setCounterpartyId(loadedCounterparties[0]!.id);
      } catch (cause) {
        if (active) {
          setError(errorMessage(cause));
          setBootstrapFailed(true);
        }
      } finally {
        if (active) setPending(null);
      }
    }
    void bootstrap();
    return () => { active = false; };
    // Recarrega apenas no início e quando o usuário solicita uma nova tentativa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envReady, bootstrapAttempt, initialOfferId]);

  function offerInput(data: FormData) {
    return {
      counterpartyId: data.get('counterpartyId'),
      commodity,
      unit: 'SC_60KG',
      quantitySc: quantityValue(data),
      deliveryStart: data.get('deliveryStart'),
      deliveryEnd: data.get('deliveryEnd'),
      purchasePricePerSc: decimalValue(data, 'purchasePricePerSc'),
      saleReferencePerSc: decimalValue(data, 'saleReferencePerSc'),
      costs: [
        { code: 'FREIGHT', amountPerSc: decimalValue(data, 'freight') },
        { code: 'STORAGE', amountPerSc: decimalValue(data, 'storage') },
        { code: 'QUALITY', amountPerSc: decimalValue(data, 'quality') },
        { code: 'FINANCIAL', amountPerSc: decimalValue(data, 'financial') },
        { code: 'OTHER', amountPerSc: decimalValue(data, 'other') },
      ],
    };
  }

  async function createCounterparty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null); setNotice(null); setPending('counterparty-save');
    const data = new FormData(event.currentTarget);
    try {
      const created = await request<Counterparty>('/v1/counterparties', 'POST', {
        legalName: data.get('legalName'), taxId: data.get('taxId'), partyType: data.get('partyType'),
      });
      setCounterparties((current) => [...(current ?? []), {
        ...created, taxIdLength: created.taxId?.length, taxIdLast4: created.taxId?.slice(-4),
      }]);
      setCounterpartyId(created.id);
      setShowCounterpartyForm(false);
      setNotice('Contraparte cadastrada e selecionada para a primeira oferta.');
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function classifyCounterparty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCounterparty) return;
    setError(null); setNotice(null); setPending('counterparty-profile');
    try {
      const updated = await request<Counterparty>(`/v1/counterparties/${selectedCounterparty.id}/profile`,
        'PATCH', { partyType: profileType });
      setCounterparties((current) => current?.map((item) => item.id === updated.id ? {
        ...updated, taxIdLength: updated.taxId?.length, taxIdLast4: updated.taxId?.slice(-4),
      } : item) ?? null);
      setNotice('Perfil da contraparte confirmado e registrado na auditoria.');
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null); setNotice(null); setPending('save');
    const data = new FormData(event.currentTarget);
    try {
      const saved = offer
        ? await request<OfferResult>(`/v1/offers/${offer.offerId}`, 'PUT', offerInput(data))
        : await request<OfferResult>('/v1/offers', 'POST', offerInput(data));
      setOffer(saved);
      setNotice(offer ? `Cenário ${saved.scenarioVersion} salvo sem apagar a versão anterior.` : 'Oferta registrada e margem calculada.');
      if (!offer) {
        setSubmission(null); setContract(null); setSummary(null);
        router.replace(`/ofertas/${saved.offerId}`);
      } else {
        setDetail(await request<OfferDetail>(`/v1/offers/${saved.offerId}`, 'GET'));
      }
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function submitOffer() {
    if (!offer) return;
    setError(null); setNotice(null); setPending('submit');
    try {
      const result = await request<SubmissionResult>(`/v1/offers/${offer.offerId}/submit`);
      setSubmission(result);
      setOffer({ ...offer, status: result.status });
      setNotice(result.status === 'APPROVED' ? 'Oferta aprovada automaticamente pela política vigente.' : 'Oferta encaminhada para aprovação.');
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function approveOffer() {
    if (!submission?.approvalId || !offer) return;
    setError(null); setPending('approve');
    try {
      await request(`/v1/approvals/${submission.approvalId}/approve`);
      setSubmission({ ...submission, status: 'APPROVED' });
      setOffer({ ...offer, status: 'APPROVED' });
      setNotice('Exceção aprovada. A oferta pode ser convertida em contrato.');
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function activateContract() {
    if (!offer) return;
    setError(null); setPending('activate');
    try {
      const activated = await request<ContractResult>(`/v1/offers/${offer.offerId}/activate-contract`);
      setContract(activated);
      setOffer({ ...offer, status: 'CONVERTED' });
      setSummary(await request<ContractSummary>(`/v1/contracts/${activated.contractId}/summary`, 'GET'));
      setNotice('Contrato ativado e obrigações iniciais geradas.');
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function cancelOffer() {
    if (!offer || cancellationReason.trim().length < 3) return;
    setError(null); setPending('cancel');
    try {
      await request(`/v1/offers/${offer.offerId}/cancel`, 'POST', { reason: cancellationReason });
      setOffer({ ...offer, status: 'CANCELLED' }); setSubmission(null);
      setNotice('Oferta cancelada com o motivo registrado na auditoria.');
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  function startNewOffer() {
    if (initialOfferId) { router.push('/ofertas/nova'); return; }
    setOffer(null); setSubmission(null); setContract(null); setSummary(null);
    setDetail(null);
    setFormResetKey((current) => current + 1);
    setCancellationReason(''); setError(null);
    setNotice('Novo formulário iniciado. As ofertas anteriores permanecem salvas no backend.');
  }

  const approved = submission?.status === 'APPROVED' || offer?.status === 'APPROVED';
  const extendedPrecision = hasExtendedPricePrecision(detail);
  const editable = !offer || (offer.status === 'DRAFT' && !submission && !extendedPrecision);
  const cancellable = Boolean(offer && !contract && offer.status !== 'CANCELLED');
  const readyForOffer = Boolean(policy && selectedCounterparty && selectedCounterparty.partyType !== 'UNCLASSIFIED');

  return (
    <>
      <ProcessRail offer={offer} submission={submission} contract={contract} />

      {pending === 'bootstrap' ? (
        <div className="loading-band" role="status"><span />Carregando dados do tenant…</div>
      ) : null}
      {!envReady ? <div className="feedback critical">As variáveis de ambiente da API e da autenticação não estão completas.</div> : null}
      {error ? <div className="feedback critical" role="alert"><strong>Não foi possível concluir</strong><span>{error}</span>{bootstrapFailed ? <Button type="button" variant="tertiary" size="sm" onClick={() => setBootstrapAttempt((current) => current + 1)} disabled={pending !== null}>Tentar novamente</Button> : null}</div> : null}
      {notice ? <div className="feedback positive" role="status"><strong>Alteração salva</strong><span>{notice}</span></div> : null}
      {extendedPrecision ? <div className="feedback critical" role="alert">Este cenário contém valores monetários com mais de duas casas decimais. A edição está bloqueada nesta tela para não alterar o preço ou os custos por arredondamento. O registro permanece consultável.</div> : null}

      {counterparties?.length === 0 || showCounterpartyForm ? (
        <section className="setup-panel" aria-labelledby="primeira-contraparte">
          <div>
            <p className="section-kicker">{counterparties?.length === 0 ? 'CONFIGURAÇÃO INICIAL · 1 DE 2' : 'CADASTRO COMERCIAL'}</p>
            <h2 id="primeira-contraparte">{counterparties?.length === 0 ? 'Cadastre a primeira contraparte' : 'Nova contraparte'}</h2>
            <p>Use os dados reais da empresa ou do produtor. Nenhum cadastro fictício será criado automaticamente.</p>
          </div>
          <form onSubmit={createCounterparty} className="setup-form">
            <Field label="Razão social" required><input name="legalName" placeholder="Nome jurídico da contraparte" minLength={3} maxLength={200} required /></Field>
            <Field label="Perfil da contraparte" required><select name="partyType" defaultValue="" required><option value="" disabled>Selecione o perfil</option><option value="PERSON">Pessoa física</option><option value="COMPANY">Pessoa jurídica</option><option value="COOPERATIVE">Cooperativa</option></select></Field>
            <Field label="CPF ou CNPJ" required hint="Digite somente os dados da contraparte que você está cadastrando."><input name="taxId" inputMode="numeric" placeholder="00.000.000/0000-00" minLength={11} maxLength={18} required /></Field>
            <Button type="submit" disabled={pending !== null}>{pending === 'counterparty-save' ? 'Salvando…' : 'Cadastrar contraparte'}</Button>
            {counterparties && counterparties.length > 0 ? <Button type="button" variant="tertiary" onClick={() => setShowCounterpartyForm(false)} disabled={pending !== null}>Cancelar</Button> : null}
          </form>
        </section>
      ) : null}

      {!policy ? (
        <div className="onboarding-note">
          <span>2</span>
          <div><strong>Publique a política de margem antes de calcular a primeira oferta.</strong><p>Os limites são configurados por você e ficam versionados.</p></div>
          <a href="/comercial/politica-margem">Configurar política</a>
        </div>
      ) : null}

      {selectedCounterparty?.partyType === 'UNCLASSIFIED' ? (
        <form onSubmit={classifyCounterparty} className="onboarding-note">
          <span>!</span>
          <div><strong>Classificar {selectedCounterparty.legalName}</strong><p>Documento de {selectedCounterparty.taxIdLength} dígitos, final {selectedCounterparty.taxIdLast4}. Confirme o perfil sem inferência automática.</p></div>
          <select aria-label="Perfil da contraparte" value={profileType} onChange={(event) => setProfileType(event.target.value as 'PERSON' | 'COMPANY' | 'COOPERATIVE')}>
            <option value="PERSON">Pessoa física</option><option value="COMPANY">Pessoa jurídica</option><option value="COOPERATIVE">Cooperativa</option>
          </select>
          <Button type="submit" disabled={pending !== null}>Confirmar perfil</Button>
        </form>
      ) : null}

      <div className="offer-layout" id="nova-oferta">
        <section className="offer-form-panel">
          <form key={`${formResetKey}-${detail?.offerId ?? 'new'}`} onSubmit={saveOffer}>
            <FormSection number={1} title="Contraparte" hint="Cadastro pertencente ao tenant atual">
              <Field label="Contraparte" required className="field-span-2">
                <select name="counterpartyId" value={counterpartyId} onChange={(event) => setCounterpartyId(event.target.value)} required disabled={!editable || !counterparties?.length}>
                  <option value="">{counterparties === null ? 'Carregando…' : 'Selecione a contraparte'}</option>
                  {counterparties?.map((item) => <option key={item.id} value={item.id}>{item.legalName}</option>)}
                </select>
              </Field>
              <Field label="Origem do cadastro" source="Rastreável"><input value="Cadastro do tenant" disabled /></Field>
              {counterparties && counterparties.length > 0 ? <Button type="button" variant="tertiary" onClick={() => setShowCounterpartyForm(true)} disabled={pending !== null}>Nova contraparte</Button> : null}
              {selectedCounterparty?.partyType === 'UNCLASSIFIED' ? <div className="field-span-2 feedback critical">Esta contraparte foi cadastrada antes dos perfis. Confirme o tipo abaixo para criar nova oferta.</div> : null}
            </FormSection>

            <FormSection number={2} title="Condição comercial" hint="Compra com entrega futura · soja ou milho">
              <Field label="Commodity" source="Escopo do MVP"><select name="commodity" value={commodity} onChange={(event) => setCommodity(event.target.value as Commodity)} disabled={Boolean(offer)}><option value="MILHO">Milho</option><option value="SOJA">Soja</option></select></Field>
              <Field label="Unidade" source="Catálogo do piloto"><input value="Saca de 60 kg" disabled /></Field>
              <Field label="Quantidade (sc)" required hint="Aceita até seis casas decimais; use vírgula para frações."><input name="quantitySc" inputMode="decimal" defaultValue={detail?.quantitySc ?? ''} placeholder="Ex.: 10000 ou 10000,5" required disabled={!editable} /></Field>
              <Field label="Início da entrega" required><input name="deliveryStart" type="date" defaultValue={detail?.deliveryStart} required disabled={!editable} /></Field>
              <Field label="Fim da entrega" required><input name="deliveryEnd" type="date" defaultValue={detail?.deliveryEnd} required disabled={!editable} /></Field>
            </FormSection>

            <FormSection number={3} title="Formação de preço" hint="Valores em reais por saca de 60 kg">
              <DecimalField name="purchasePricePerSc" label="Preço de compra" prefix="R$" suffix="/sc" defaultValue={detail?.purchasePricePerSc ?? '0'} required disabled={!editable} />
              <DecimalField name="saleReferencePerSc" label="Referência de venda" prefix="R$" suffix="/sc" defaultValue={detail?.saleReferencePerSc ?? '0'} required disabled={!editable} />
              <DecimalField name="freight" label="Frete" prefix="R$" suffix="/sc" defaultValue={costAmount(detail, 'FREIGHT')} required disabled={!editable} />
              <DecimalField name="storage" label="Armazenagem" prefix="R$" suffix="/sc" defaultValue={costAmount(detail, 'STORAGE')} required disabled={!editable} />
              <DecimalField name="quality" label="Qualidade" prefix="R$" suffix="/sc" defaultValue={costAmount(detail, 'QUALITY')} required disabled={!editable} />
              <DecimalField name="financial" label="Financeiro" prefix="R$" suffix="/sc" defaultValue={costAmount(detail, 'FINANCIAL')} required disabled={!editable} />
              <DecimalField name="other" label="Outros custos" prefix="R$" suffix="/sc" defaultValue={costAmount(detail, 'OTHER')} required disabled={!editable} />
            </FormSection>

            <div className="form-action-bar">
              <div><strong>{readyForOffer ? 'Pronto para calcular' : 'Configuração inicial pendente'}</strong><span>Cada recálculo preserva a versão anterior do cenário.</span></div>
              {editable ? <Button type="submit" disabled={pending !== null || !readyForOffer}>{pending === 'save' ? 'Calculando…' : offer ? 'Salvar nova versão' : 'Registrar e calcular'}</Button> : null}
              {offer ? <Button type="button" variant="tertiary" onClick={startNewOffer} disabled={pending !== null}>Nova oferta</Button> : null}
            </div>
          </form>
        </section>

        <aside className="pricing-panel" aria-labelledby="margem-projetada">
          <header><p className="section-kicker">CÁLCULO DETERMINÍSTICO</p><Status tone={statusTone(offer?.status)}>{statusLabel(offer?.status)}</Status></header>
          <h2 id="margem-projetada">Margem projetada</h2>
          {offer ? (
            <>
              <div className="margin-value"><strong>{formatCurrency(offer.pricing.projectedMarginPerSc)}</strong><span>por saca</span></div>
              <dl className="calculation-list">
                <div><dt>Custos diretos / sc</dt><dd>{formatCurrency(offer.pricing.totalCostsPerSc)}</dd></div>
                <div><dt>Política aplicada</dt><dd>versão {offer.policyVersion}</dd></div>
                <div><dt>Cenário</dt><dd>versão {offer.scenarioVersion ?? 1}</dd></div>
              </dl>
              {!submission && offer.status === 'DRAFT' ? <Button type="button" onClick={submitOffer} disabled={pending !== null}>Submeter oferta</Button> : null}
              {submission?.status === 'IN_APPROVAL' ? <div className="decision-box"><Status tone="warning">Aprovação necessária</Status><p>A margem ficou fora da alçada automática definida na política.</p><Button type="button" onClick={approveOffer} disabled={pending !== null}>Aprovar exceção</Button></div> : null}
              {approved && !contract ? <div className="decision-box"><Status tone="positive">Aprovada</Status><Button type="button" onClick={activateContract} disabled={pending !== null}>Ativar contrato</Button></div> : null}
              {contract ? <Status tone="positive">Contrato ativo</Status> : null}
              <p className="identifier tt-mono">{contract?.contractId ?? offer.offerId}</p>
              {cancellable ? (
                <div className="cancel-area">
                  <Field label="Motivo do cancelamento"><textarea value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} minLength={3} maxLength={500} placeholder="Registre o motivo operacional" /></Field>
                  <Button type="button" variant="danger" onClick={cancelOffer} disabled={pending !== null || cancellationReason.trim().length < 3}>Cancelar oferta</Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="pricing-empty"><span aria-hidden="true">Σ</span><strong>Aguardando condições</strong><p>A margem será calculada pela API com a política vigente e registrada no cenário.</p></div>
          )}
        </aside>
      </div>

      {summary ? (
        <section className="obligations-panel">
          <div><p className="section-kicker">CONTRATO ATIVO</p><h2>Obrigações para iniciar a execução</h2></div>
          <div>
            {summary.obligations.map((item) => <p key={item.code}><strong>{obligationLabel(item.code)}</strong><Status tone="warning">{item.status}</Status></p>)}
            {contract ? <a className="operational-link" href={`/contratos/${contract.contractId}`}>Abrir contrato <span aria-hidden="true">→</span></a> : null}
          </div>
        </section>
      ) : null}

    </>
  );
}

function ProcessRail({ offer, submission, contract }: { offer: OfferResult | null; submission: SubmissionResult | null; contract: ContractResult | null }) {
  const steps = [
    { label: 'Oferta', state: offer ? 'done' : 'current' },
    { label: 'Cálculo', state: offer ? 'done' : 'future' },
    { label: 'Aprovação', state: contract || offer?.status === 'APPROVED' || submission?.status === 'APPROVED' ? 'done' : submission ? 'current' : 'future' },
    { label: 'Contrato', state: contract ? 'done' : offer?.status === 'APPROVED' || submission?.status === 'APPROVED' ? 'current' : 'future' },
  ];
  return <ol className="process-rail" aria-label="Etapas da oferta">{steps.map((step, index) => <li key={step.label} data-state={step.state}><span>{step.state === 'done' ? '✓' : index + 1}</span><strong>{step.label}</strong></li>)}</ol>;
}

function readableError(value: unknown) {
  const code = Array.isArray(value) ? value.join(' · ') : String(value ?? '');
  const messages: Record<string, string> = {
    COUNTERPARTY_TAX_ID_ALREADY_EXISTS: 'Já existe uma contraparte com este CPF ou CNPJ.',
    COUNTERPARTY_PROFILE_REQUIRED: 'Confirme se a contraparte é pessoa física, jurídica ou cooperativa antes de registrar a oferta.',
    PARTY_TYPE_TAX_ID_MISMATCH: 'O perfil selecionado não corresponde ao documento cadastrado.',
    AUTO_APPROVAL_BELOW_ABSOLUTE_FLOOR: 'A margem de aprovação automática não pode ficar abaixo do piso absoluto.',
    MARGIN_BELOW_ABSOLUTE_FLOOR: 'A margem calculada ficou abaixo do piso absoluto da política.',
    CAPABILITY_NOT_FOUND: 'Seu usuário não possui permissão para executar esta ação.',
    ACTIVE_MEMBERSHIP_NOT_FOUND: 'Seu usuário não possui vínculo ativo com este tenant.',
    ACTIVE_MEMBERSHIP_REQUIRED: 'Seu usuário ainda não possui acesso ativo a uma empresa.',
    INVALID_DELIVERY_WINDOW: 'A data final da entrega deve ser igual ou posterior à data inicial.',
    OFFER_NOT_FOUND: 'Esta oferta não existe ou não pertence à sua empresa.',
  };
  return messages[code] ?? (code || 'A operação não pôde ser concluída.');
}

function errorMessage(cause: unknown) { return cause instanceof Error ? cause.message : 'Falha inesperada.'; }
function costAmount(detail: OfferDetail | null, code: string) {
  return detail?.costs.find((cost) => cost.code === code)?.amountPerSc ?? '0';
}
function hasExtendedPricePrecision(detail: OfferDetail | null) {
  if (!detail) return false;
  const values = [detail.purchasePricePerSc, detail.saleReferencePerSc,
    ...detail.costs.map((cost) => cost.amountPerSc)];
  return values.some((value) => /[1-9]/.test((value.split('.')[1] ?? '').slice(2)));
}
function decimalValue(data: FormData, name: string, fractionDigits = 2) {
  return normalizeDecimalInput(String(data.get(name) ?? ''), fractionDigits) ?? '';
}
function quantityValue(data: FormData) {
  const raw = String(data.get('quantitySc') ?? '').trim();
  if (!/^\d+(?:[,.]\d{1,6})?$/.test(raw) || Number(raw.replace(',', '.')) <= 0) {
    throw new Error('Informe uma quantidade maior que zero, sem separador de milhar e com até seis casas decimais.');
  }
  return raw.replace(',', '.');
}
function obligationLabel(code: string) { return code === 'SIGNED_CONTRACT' ? 'Contrato assinado' : code === 'DELIVERY_SCHEDULE' ? 'Programação de entrega' : code; }
function statusLabel(status?: string) { return status === 'CANCELLED' ? 'Cancelada' : status === 'IN_APPROVAL' ? 'Em aprovação' : status === 'APPROVED' ? 'Aprovada' : status === 'CONVERTED' ? 'Contratada' : 'Rascunho'; }
function statusTone(status?: string): 'neutral' | 'positive' | 'warning' | 'critical' { return status === 'CANCELLED' ? 'critical' : status === 'IN_APPROVAL' ? 'warning' : status === 'APPROVED' || status === 'CONVERTED' ? 'positive' : 'neutral'; }
function formatCurrency(value: string) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)); }
