'use client';

import { Button, Card, Status } from '@mountier/tier-trade-design-system';
import { FormEvent, useMemo, useState } from 'react';

type OfferResult = {
  offerId: string;
  status: string;
  pricing: { totalCostsPerSc: string; projectedMarginPerSc: string };
  policyVersion: number;
};
type SubmissionResult = { offerId: string; status: string; decision: string; approvalId?: string };
type ContractResult = { contractId: string; offerId: string; status: string };
type ContractSummary = {
  id: string;
  status: string;
  obligations: Array<{ code: string; status: string }>;
};

export function OfferWorkspace() {
  const [offer, setOffer] = useState<OfferResult | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [contract, setContract] = useState<ContractResult | null>(null);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const envReady = useMemo(() => Boolean(
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_DEV_TENANT_ID &&
    process.env.NEXT_PUBLIC_DEV_ACTOR_ID && process.env.NEXT_PUBLIC_DEV_COUNTERPARTY_ID,
  ), []);
  const headers = useMemo(() => ({
    'content-type': 'application/json',
    'x-tenant-id': process.env.NEXT_PUBLIC_DEV_TENANT_ID!,
    'x-actor-id': process.env.NEXT_PUBLIC_DEV_ACTOR_ID!,
  }), []);

  async function request<T>(path: string, method: 'GET' | 'POST' = 'POST', body?: object): Promise<T> {
    setError(null);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? payload.code ?? 'A operação não pôde ser concluída.');
    return payload as T;
  }

  async function createOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending('create'); setOffer(null); setSubmission(null); setContract(null); setSummary(null);
    const data = new FormData(event.currentTarget);
    try {
      setOffer(await request<OfferResult>('/v1/offers', 'POST', {
        counterpartyId: process.env.NEXT_PUBLIC_DEV_COUNTERPARTY_ID,
        commodity: 'MILHO', unit: 'SC_60KG', quantitySc: data.get('quantitySc'),
        deliveryStart: data.get('deliveryStart'), deliveryEnd: data.get('deliveryEnd'),
        purchasePricePerSc: data.get('purchasePricePerSc'), saleReferencePerSc: data.get('saleReferencePerSc'),
        costs: [
          { code: 'FREIGHT', amountPerSc: data.get('freight') },
          { code: 'STORAGE', amountPerSc: data.get('storage') },
        ],
      }));
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

  const approved = submission?.status === 'APPROVED';
  return (
    <div className="workspace" id="nova-oferta">
      <Card className="form-card">
        <div className="section-heading"><div><p>Entrada direta no ERP</p><h2>Condições da compra</h2></div><Status>{offer?.status ?? 'RASCUNHO'}</Status></div>
        <form onSubmit={createOffer}>
          <div className="field-grid">
            <label>Commodity<input value="Milho" disabled /></label>
            <label>Unidade<input value="Saca de 60 kg" disabled /></label>
            <label>Quantidade (sc)<input name="quantitySc" inputMode="decimal" defaultValue="10000" required disabled={Boolean(offer)} /></label>
            <label>Início da entrega<input name="deliveryStart" type="date" required disabled={Boolean(offer)} /></label>
            <label>Fim da entrega<input name="deliveryEnd" type="date" required disabled={Boolean(offer)} /></label>
            <label>Preço de compra / sc<input name="purchasePricePerSc" inputMode="decimal" required disabled={Boolean(offer)} /></label>
            <label>Referência de venda / sc<input name="saleReferencePerSc" inputMode="decimal" required disabled={Boolean(offer)} /></label>
            <label>Frete / sc<input name="freight" inputMode="decimal" defaultValue="0.00" required disabled={Boolean(offer)} /></label>
            <label>Armazenagem / sc<input name="storage" inputMode="decimal" defaultValue="0.00" required disabled={Boolean(offer)} /></label>
          </div>
          <div className="form-actions">
            <p>O resultado usa a política ativa e versionada do tenant.</p>
            {!offer && <Button disabled={pending !== null || !envReady}>{pending === 'create' ? 'Calculando…' : 'Registrar e calcular'}</Button>}
          </div>
        </form>
        {!envReady && <p className="feedback error">Configure o arquivo `.env.local` para conectar esta tela à API local.</p>}
        {error && <p className="feedback error">{error}</p>}
      </Card>
      <Card className="result-card">
        <p className="eyebrow">CENÁRIO DETERMINÍSTICO</p><h2>Margem projetada</h2>
        {offer ? <>
          <strong className="margin tt-mono">R$ {offer.pricing.projectedMarginPerSc}</strong><span>por saca</span>
          <dl><div><dt>Custos / sc</dt><dd className="tt-mono">R$ {offer.pricing.totalCostsPerSc}</dd></div>
            <div><dt>Política</dt><dd>versão {offer.policyVersion}</dd></div></dl>
          {!submission && <Button onClick={submitOffer} disabled={pending !== null}>Submeter oferta</Button>}
          {submission?.status === 'IN_APPROVAL' && <div className="next-action"><Status tone="warning">APROVAÇÃO NECESSÁRIA</Status><Button onClick={approveOffer} disabled={pending !== null}>Aprovar exceção</Button></div>}
          {approved && !contract && <div className="next-action"><Status tone="positive">APROVADA</Status><Button onClick={activateContract} disabled={pending !== null}>Ativar contrato</Button></div>}
          {contract && <Status tone="positive">CONTRATO ATIVO</Status>}
          <p className="identifier tt-mono">{contract?.contractId ?? offer.offerId}</p>
        </> : <p className="empty">Preencha as condições. A margem será calculada pela API e persistida com a versão da política usada.</p>}
      </Card>
      {summary && <Card className="contract-card"><div><p className="eyebrow">CONTRATO ATIVO</p><h2>Obrigações para iniciar a execução</h2></div>
        <div className="obligations">{summary.obligations.map((item) => <div key={item.code}><strong>{obligationLabel(item.code)}</strong><Status tone="warning">{item.status}</Status></div>)}</div>
      </Card>}
    </div>
  );
}

function errorMessage(cause: unknown) { return cause instanceof Error ? cause.message : 'Falha inesperada.'; }
function obligationLabel(code: string) { return code === 'SIGNED_CONTRACT' ? 'Contrato assinado' : code === 'DELIVERY_SCHEDULE' ? 'Programação de entrega' : code; }
