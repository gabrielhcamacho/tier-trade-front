'use client';

import { Button, Card, Status } from '@mountier/tier-trade-design-system';
import { FormEvent, useMemo, useState } from 'react';

type Result = {
  offerId: string;
  status: string;
  pricing: { totalCostsPerSc: string; projectedMarginPerSc: string };
  policyVersion: number;
};

export function OfferWorkspace() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const envReady = useMemo(() => Boolean(
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_DEV_TENANT_ID &&
    process.env.NEXT_PUBLIC_DEV_ACTOR_ID && process.env.NEXT_PUBLIC_DEV_COUNTERPARTY_ID,
  ), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError(null); setResult(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/offers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': process.env.NEXT_PUBLIC_DEV_TENANT_ID!,
          'x-actor-id': process.env.NEXT_PUBLIC_DEV_ACTOR_ID!,
        },
        body: JSON.stringify({
          counterpartyId: process.env.NEXT_PUBLIC_DEV_COUNTERPARTY_ID,
          commodity: 'MILHO', unit: 'SC_60KG',
          quantitySc: data.get('quantitySc'), deliveryStart: data.get('deliveryStart'),
          deliveryEnd: data.get('deliveryEnd'), purchasePricePerSc: data.get('purchasePricePerSc'),
          saleReferencePerSc: data.get('saleReferencePerSc'),
          costs: [
            { code: 'FREIGHT', amountPerSc: data.get('freight') },
            { code: 'STORAGE', amountPerSc: data.get('storage') },
          ],
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? body.code ?? 'Não foi possível registrar a oferta.');
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha inesperada.');
    } finally { setPending(false); }
  }

  return (
    <div className="workspace" id="nova-oferta">
      <Card className="form-card">
        <div className="section-heading"><div><p>Entrada direta no ERP</p><h2>Condições da compra</h2></div><Status>RASCUNHO</Status></div>
        <form onSubmit={submit}>
          <div className="field-grid">
            <label>Commodity<input value="Milho" disabled /></label>
            <label>Unidade<input value="Saca de 60 kg" disabled /></label>
            <label>Quantidade (sc)<input name="quantitySc" inputMode="decimal" defaultValue="10000" required /></label>
            <label>Início da entrega<input name="deliveryStart" type="date" required /></label>
            <label>Fim da entrega<input name="deliveryEnd" type="date" required /></label>
            <label>Preço de compra / sc<input name="purchasePricePerSc" inputMode="decimal" required /></label>
            <label>Referência de venda / sc<input name="saleReferencePerSc" inputMode="decimal" required /></label>
            <label>Frete / sc<input name="freight" inputMode="decimal" defaultValue="0.00" required /></label>
            <label>Armazenagem / sc<input name="storage" inputMode="decimal" defaultValue="0.00" required /></label>
          </div>
          <div className="form-actions">
            <p>O resultado usa a política ativa e versionada do tenant.</p>
            <Button disabled={pending || !envReady}>{pending ? 'Calculando…' : 'Registrar e calcular'}</Button>
          </div>
        </form>
        {!envReady && <p className="feedback error">Configure o arquivo `.env.local` para conectar esta tela à API local.</p>}
        {error && <p className="feedback error">{error}</p>}
      </Card>
      <Card className="result-card">
        <p className="eyebrow">CENÁRIO DETERMINÍSTICO</p>
        <h2>Margem projetada</h2>
        {result ? <>
          <strong className="margin tt-mono">R$ {result.pricing.projectedMarginPerSc}</strong>
          <span>por saca</span>
          <dl><div><dt>Custos / sc</dt><dd className="tt-mono">R$ {result.pricing.totalCostsPerSc}</dd></div>
            <div><dt>Política</dt><dd>versão {result.policyVersion}</dd></div></dl>
          <Status tone="positive">{result.status}</Status>
          <p className="identifier tt-mono">{result.offerId}</p>
        </> : <p className="empty">Preencha as condições. A margem será calculada pela API e persistida com a versão da política usada.</p>}
      </Card>
    </div>
  );
}
