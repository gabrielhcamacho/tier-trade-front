'use client';

import { Button, DecimalField, Field } from '@mountier/tier-trade-design-system';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import type { ScheduledLoad } from '../../../lib/loads';
import { cancelLoadAction, rescheduleLoadAction, type ReceiptActionState } from './actions';

const INITIAL_STATE: ReceiptActionState = { ok: false, message: '' };

export function ScheduleControls({ load, deliveryStart, deliveryEnd }: {
  load: ScheduledLoad;
  deliveryStart: string;
  deliveryEnd: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'reschedule' | 'cancel' | null>(null);
  const [rescheduleState, rescheduleAction, rescheduling] = useActionState(rescheduleLoadAction, INITIAL_STATE);
  const [cancelState, cancelAction, cancelling] = useActionState(cancelLoadAction, INITIAL_STATE);

  useEffect(() => {
    if (rescheduleState.ok || cancelState.ok) {
      setMode(null);
      router.refresh();
    }
  }, [rescheduleState.ok, cancelState.ok, router]);

  if (load.status !== 'SCHEDULED') return null;

  return (
    <div className="load-schedule-controls">
      <div className="load-schedule-control-actions">
        <Button type="button" variant="secondary" onClick={() => setMode('reschedule')}>Reprogramar carga</Button>
        <Button type="button" variant="secondary" onClick={() => setMode('cancel')}>Cancelar carga</Button>
      </div>
      {(rescheduleState.ok || cancelState.ok) && !mode ? (
        <div className="feedback positive" role="status">{rescheduleState.ok ? rescheduleState.message : cancelState.message}</div>
      ) : null}
      {mode ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMode(null);
        }}>
          <section className="load-schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="load-change-title">
            <header>
              <div><p className="section-kicker">PROGRAMAÇÃO</p><h2 id="load-change-title">{mode === 'reschedule' ? 'Reprogramar carga' : 'Cancelar carga'}</h2>
                <p>{mode === 'reschedule' ? 'Apenas cargas ainda não recebidas. O saldo do contrato será recalculado.' : 'A carga ficará no histórico e o peso previsto será liberado no contrato.'}</p></div>
              <button className="modal-close" type="button" onClick={() => setMode(null)} aria-label="Fechar">×</button>
            </header>
            <form action={mode === 'reschedule' ? rescheduleAction : cancelAction} className="load-schedule-form">
              <input type="hidden" name="loadId" value={load.id} />
              {mode === 'reschedule' ? <>
                <Field label="Data e horário" required hint={`Horário local: ${load.timezone}.`}>
                  <input name="scheduledLocal" type="datetime-local" defaultValue={localSchedule(load.scheduledAt, load.timezone)} min={`${deliveryStart}T00:00`} max={`${deliveryEnd}T23:59`} required />
                </Field>
                <DecimalField name="expectedWeightKg" label="Peso previsto" suffix="kg" defaultValue={load.expectedWeightKg} fractionDigits={3} required />
                <Field label="Placa do veículo" required><input name="vehiclePlate" defaultValue={load.vehiclePlate} minLength={7} maxLength={8} required /></Field>
                <Field label="Transportadora" required><input name="carrierName" defaultValue={load.carrierName} minLength={2} maxLength={200} required /></Field>
                <Field label="Destino" required className="field-span-2"><input name="destinationCode" defaultValue={load.destinationCode} minLength={2} maxLength={32} required /></Field>
              </> : null}
              <Field label="Motivo da alteração" required className="field-span-2"><textarea name="reason" minLength={10} maxLength={500} required placeholder="Explique por que a programação está sendo alterada." /></Field>
              {(mode === 'reschedule' ? rescheduleState : cancelState).message && !(mode === 'reschedule' ? rescheduleState : cancelState).ok ? (
                <div className="feedback critical load-schedule-feedback" role="alert">{(mode === 'reschedule' ? rescheduleState : cancelState).message}</div>
              ) : null}
              <div className="load-schedule-actions">
                <Button type="button" variant="secondary" onClick={() => setMode(null)} disabled={rescheduling || cancelling}>Voltar</Button>
                <Button type="submit" disabled={rescheduling || cancelling}>{rescheduling || cancelling ? 'Salvando…' : mode === 'reschedule' ? 'Salvar programação' : 'Confirmar cancelamento'}</Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function localSchedule(value: string, timezone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value)).replace(' ', 'T');
}
