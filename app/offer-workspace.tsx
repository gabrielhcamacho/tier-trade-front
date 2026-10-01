'use client';

import { Button, Card, Status } from '@mountier/tier-trade-design-system';
import { type FormEvent, useState } from 'react';
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
type MarginPolicy = {
  policyId?: string;
  commodity: string;
  version: number;
  autoApprovalMarginPerSc: string;
  absoluteFloorMarginPerSc: string;
};
type Counterparty = { id: string; legalName: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export function OfferWorkspace() {
  const [offer, setOffer] = useState<OfferResult | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [contract, setContract] = useState<ContractResult | null>(null);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [policy, setPolicy] = useState<MarginPolicy | null>(null);
  const [counterparties, setCounterparties] = useState<Counterparty[] | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const authConfigured = hasSupabaseConfiguration();
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID ?? process.env.NEXT_PUBLIC_DEV_TENANT_ID;
  const envReady = Boolean(apiUrl && tenantId && (authConfigured || process.env.NEXT_PUBLIC_DEV_ACTOR_ID));

  async function identityHeaders(): Promise<Record<string, string>> {
    if (!tenantId) throw new Error('Tenant não configurado.');
    if (authConfigured) {
      const { data } = await createClient().auth.getSession();
      if (!data.session?.access_token) throw new Error('Sessão expirada. Entre novamente.');
      return { 'x-tenant-id': tenantId, authorization: `Bearer ${data.session.access_token}` };
    }
    return { 'x-tenant-id': tenantId, 'x-actor-id': process.env.NEXT_PUBLIC_DEV_ACTOR_ID ?? '' };
  }

  async function request<T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' = 'POST', body?: object): Promise<T> {
    setError(null);
    const identity = await identityHeaders();
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: body ? { ...identity, 'content-type': 'application/json' } : identity,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? payload.code ?? 'A operação não pôde ser concluída.');
    return payload as T;
  }

  function offerInput(data: FormData) {
    return {
      counterpartyId: data.get('counterpartyId'),
      commodity: 'MILHO', unit: 'SC_60KG', quantitySc: data.get('quantitySc'),
      deliveryStart: data.get('deliveryStart'), deliveryEnd: data.get('deliveryEnd'),
      purchasePricePerSc: data.get('purchasePricePerSc'), saleReferencePerSc: data.get('saleReferencePerSc'),
      costs: [{ code: 'FREIGHT', amountPerSc: data.get('freight') }, { code: 'STORAGE', amountPerSc: data.get('storage') }],
    };
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending('save');
    const data = new FormData(event.currentTarget);
    try {
      const saved = offer
        ? await request<OfferResult>(`/v1/offers/${offer.offerId}`, 'PUT', offerInput(data))
        : await request<OfferResult>('/v1/offers', 'POST', offerInput(data));
      setOffer(saved);
      if (!offer) { setSubmission(null); setContract(null); setSummary(null); }
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function submitOffer() {
    if (!offer) return;
    setPending('submit');
    try { setSubmission(await request(`/v1/offers/${offer.offerId}/submit`)); }
    catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function approveOffer() {
    if (!submission?.approvalId) return;
    setPending('approve');
    try {
      await request(`/v1/approvals/${submission.approvalId}/approve`);
      setSubmission({ ...submission, status: 'APPROVED' });
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function activateContract() {
    if (!offer) return;
    setPending('activate');
    try {
      const activated = await request<ContractResult>(`/v1/offers/${offer.offerId}/activate-contract`);
      setContract(activated);
      setSummary(await request<ContractSummary>(`/v1/contracts/${activated.contractId}/summary`, 'GET'));
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function cancelOffer() {
    if (!offer || cancellationReason.trim().length < 3) return;
    setPending('cancel');
    try {
      await request(`/v1/offers/${offer.offerId}/cancel`, 'POST', { reason: cancellationReason });
      setOffer({ ...offer, status: 'CANCELLED' }); setSubmission(null);
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function loadPolicy() {
    setPending('policy-load');
    try { setPolicy(await request('/v1/settings/margin-policy/MILHO', 'GET')); }
    catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function loadCounterparties() {
    setPending('counterparties');
    try { setCounterparties(await request('/v1/counterparties', 'GET')); }
    catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  async function configurePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending('policy-save');
    const data = new FormData(event.currentTarget);
    try {
      setPolicy(await request('/v1/settings/margin-policy', 'PATCH', {
        commodity: 'MILHO', autoApprovalMarginPerSc: data.get('autoApprovalMarginPerSc'),
        absoluteFloorMarginPerSc: data.get('absoluteFloorMarginPerSc'),
      }));
    } catch (cause) { setError(errorMessage(cause)); } finally { setPending(null); }
  }

  const approved = submission?.status === 'APPROVED';
  const editable = !offer || (offer.status === 'DRAFT' && !submission);
  const cancellable = offer && !contract && offer.status !== 'CANCELLED';
  return <>
    <div className="workspace" id="nova-oferta">
      <Card className="form-card">
        <div className="section-heading"><div><p>Entrada direta no ERP</p><h2>Condições da compra</h2></div><Status>{statusLabel(offer?.status)}</Status></div>
        <form onSubmit={saveOffer}>
          <div className="field-grid">
            <label>Contraparte{counterparties ? <select name="counterpartyId" required disabled={!editable}>
              <option value="">Selecione</option>{counterparties.map((item) => <option key={item.id} value={item.id}>{item.legalName}</option>)}</select>
            : <Button type="button" onClick={loadCounterparties} disabled={pending !== null || !envReady}>Carregar contrapartes</Button>}</label>
            <label>Commodity<input value="Milho" disabled /></label><label>Unidade<input value="Saca de 60 kg" disabled /></label>
            <label>Quantidade (sc)<input name="quantitySc" inputMode="decimal" defaultValue="10000" required disabled={!editable} /></label>
            <label>Início da entrega<input name="deliveryStart" type="date" required disabled={!editable} /></label>
            <label>Fim da entrega<input name="deliveryEnd" type="date" required disabled={!editable} /></label>
            <label>Preço de compra / sc<input name="purchasePricePerSc" inputMode="decimal" required disabled={!editable} /></label>
            <label>Referência de venda / sc<input name="saleReferencePerSc" inputMode="decimal" required disabled={!editable} /></label>
            <label>Frete / sc<input name="freight" inputMode="decimal" defaultValue="0.00" required disabled={!editable} /></label>
            <label>Armazenagem / sc<input name="storage" inputMode="decimal" defaultValue="0.00" required disabled={!editable} /></label>
          </div>
          <div className="form-actions"><p>Cada recálculo preserva a versão anterior do cenário.</p>
            {editable && <Button disabled={pending !== null || !envReady || !counterparties}>{pending === 'save' ? 'Calculando…' : offer ? 'Salvar nova versão' : 'Registrar e calcular'}</Button>}
          </div>
        </form>
        {!envReady && <p className="feedback error">Configure as variáveis de ambiente para conectar esta tela à API.</p>}
        {error && <p className="feedback error">{error}</p>}
      </Card>
      <Card className="result-card">
        <p className="eyebrow">CENÁRIO DETERMINÍSTICO</p><h2>Margem projetada</h2>
        {offer ? <>
          <strong className="margin tt-mono">R$ {offer.pricing.projectedMarginPerSc}</strong><span>por saca</span>
          <dl><div><dt>Custos / sc</dt><dd className="tt-mono">R$ {offer.pricing.totalCostsPerSc}</dd></div>
            <div><dt>Política</dt><dd>versão {offer.policyVersion}</dd></div><div><dt>Cenário</dt><dd>versão {offer.scenarioVersion ?? 1}</dd></div></dl>
          {!submission && offer.status === 'DRAFT' && <Button onClick={submitOffer} disabled={pending !== null}>Submeter oferta</Button>}
          {submission?.status === 'IN_APPROVAL' && <div className="next-action"><Status tone="warning">APROVAÇÃO NECESSÁRIA</Status><Button onClick={approveOffer} disabled={pending !== null}>Aprovar exceção</Button></div>}
          {approved && !contract && <div className="next-action"><Status tone="positive">APROVADA</Status><Button onClick={activateContract} disabled={pending !== null}>Ativar contrato</Button></div>}
          {contract && <Status tone="positive">CONTRATO ATIVO</Status>}{offer.status === 'CANCELLED' && <Status tone="warning">OFERTA CANCELADA</Status>}
          <p className="identifier tt-mono">{contract?.contractId ?? offer.offerId}</p>
          {cancellable && <div className="cancel-box"><label>Motivo do cancelamento<input value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} minLength={3} maxLength={500} /></label>
            <Button onClick={cancelOffer} disabled={pending !== null || cancellationReason.trim().length < 3}>Cancelar oferta</Button></div>}
        </> : <p className="empty">Preencha as condições. A margem será calculada pela API e persistida com a versão da política usada.</p>}
      </Card>
      {summary && <Card className="contract-card"><div><p className="eyebrow">CONTRATO ATIVO</p><h2>Obrigações para iniciar a execução</h2></div>
        <div className="obligations">{summary.obligations.map((item) => <div key={item.code}><strong>{obligationLabel(item.code)}</strong><Status tone="warning">{item.status}</Status></div>)}</div></Card>}
    </div>
    <section className="settings-section" id="politica-margem"><Card className="settings-card">
      <div><p className="eyebrow">GOVERNANÇA COMERCIAL</p><h2>Política de margem do milho</h2><p className="empty">A alteração cria uma nova versão. Ofertas já calculadas mantêm a política registrada no cenário.</p></div>
      {policy ? <form onSubmit={configurePolicy} className="policy-form">
        <label>Aprovação automática / sc<input name="autoApprovalMarginPerSc" inputMode="decimal" defaultValue={policy.autoApprovalMarginPerSc} required /></label>
        <label>Piso absoluto / sc<input name="absoluteFloorMarginPerSc" inputMode="decimal" defaultValue={policy.absoluteFloorMarginPerSc} required /></label>
        <div><Status>VERSÃO {policy.version}</Status><Button disabled={pending !== null}>Publicar nova versão</Button></div>
      </form> : <Button onClick={loadPolicy} disabled={pending !== null || !envReady}>Carregar política atual</Button>}
    </Card></section>
  </>;
}

function errorMessage(cause: unknown) { return cause instanceof Error ? cause.message : 'Falha inesperada.'; }
function obligationLabel(code: string) { return code === 'SIGNED_CONTRACT' ? 'Contrato assinado' : code === 'DELIVERY_SCHEDULE' ? 'Programação de entrega' : code; }
function statusLabel(status?: string) { return status === 'CANCELLED' ? 'CANCELADA' : status ?? 'RASCUNHO'; }
