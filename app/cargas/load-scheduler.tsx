'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { scheduleLoadAction, type ScheduleLoadState } from './actions';

const INITIAL_STATE: ScheduleLoadState = { ok: false, message: '' };

export function LoadScheduler({
  contractId,
  deliveryStart,
  deliveryEnd,
}: {
  contractId: string;
  deliveryStart: string;
  deliveryEnd: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(scheduleLoadAction, INITIAL_STATE);

  useEffect(() => {
    if (!state.ok) return;
    setOpen(false);
    router.refresh();
  }, [router, state]);

  return (
    <div className="load-scheduler">
      <Button type="button" onClick={() => setOpen(true)}>Programar carga</Button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="load-schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="load-schedule-title">
            <header>
              <div>
                <p className="section-kicker">NOVA PROGRAMAÇÃO</p>
                <h2 id="load-schedule-title">Programar carga</h2>
                <p>Reserve o volume no contrato e registre os dados previstos para o recebimento.</p>
              </div>
              <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
            </header>
            <form action={formAction} className="load-schedule-form">
              <input type="hidden" name="contractId" value={contractId} />
              <Field label="Data e horário" required hint="Horário local configurado para o tenant.">
                <input name="scheduledLocal" type="datetime-local" defaultValue={`${deliveryStart}T08:00`} min={`${deliveryStart}T00:00`} max={`${deliveryEnd}T23:59`} required />
              </Field>
              <DecimalField name="expectedWeightKg" label="Peso previsto" suffix="kg" defaultValue="0" fractionDigits={3} emptyWhenZero required hint="O saldo do contrato será reservado ao salvar." />
              <Field label="Placa do veículo" required>
                <input name="vehiclePlate" placeholder="ABC1D23" minLength={7} maxLength={8} autoCapitalize="characters" required />
              </Field>
              <Field label="Transportadora" required>
                <input name="carrierName" placeholder="Nome da transportadora" minLength={2} maxLength={160} required />
              </Field>
              <Field label="Destino" required className="field-span-2">
                <input name="destinationCode" placeholder="Ex.: ARMAZEM-SORRISO" minLength={2} maxLength={80} required />
              </Field>
              {state.message && !state.ok ? <div className="feedback critical load-schedule-feedback" role="alert">{state.message}</div> : null}
              <div className="load-schedule-actions">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
                <Button type="submit" disabled={pending}>{pending ? 'Programando…' : 'Programar carga'}</Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
