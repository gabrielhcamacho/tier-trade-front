import { Columns, SegmentBar, Timeline, palette } from '../charts';
import { commodity, dates, fmt, list, num, party, ratio, text } from '../format';
import { Grid, Panel, RecordList } from '../ui';
import { MarginBars } from './shared';
import { attention, critical, plural, type ViewInput, type ViewOutput } from './types';

const statusNames: Record<string, string> = {
  DRAFT: 'Rascunho', AWAITING_SIGNATURE: 'Aguardando assinatura', SIGNED: 'Assinado', ACTIVE: 'Em execução', CLOSED: 'Encerrado', CANCELLED: 'Cancelado',
};
const statusColors: Record<string, string> = {
  DRAFT: '#cfdccf', AWAITING_SIGNATURE: '#9fc4a9', SIGNED: '#55977a', ACTIVE: 'var(--viz-1)', CLOSED: '#8f9893', CANCELLED: '#d0d4d1',
};
const agingNames: Record<string, [string, string]> = {
  OVERDUE_30: ['+30 dias', 'vencidas'], OVERDUE: ['1 a 30 dias', 'vencidas'], NEXT_7: ['7 dias', 'a vencer'],
  NEXT_30: ['30 dias', 'a vencer'], NEXT_90: ['90 dias', 'a vencer'], LATER: ['Depois', 'de 90 dias'], NO_DUE_DATE: ['Sem prazo', 'definido'],
};

export function contractsView({ indicators: i, breakdowns, today }: ViewInput): ViewOutput {
  const contracted = num(i.contractedKg);
  const received = num(i.receivedKg);
  const overdue = num(i.overdueObligations);
  const open = num(i.openObligations ?? i.pendingObligations);
  const sacks = contracted / 60;
  const formalization = num(i.pendingSignatures) + num(i.pendingDocuments);
  const delivery = list(breakdowns, 'deliveryByContract');
  const aging = list(breakdowns, 'obligationAging');
  const upcoming = list(breakdowns, 'upcomingObligations');
  const mix = list(breakdowns, 'statusMix');

  return {
    kpis: [
      { key: 'active', label: 'Contratos ativos', value: fmt.int(i.activeContracts), note: `${fmt.tonnes(contracted)} contratadas`, href: '/contratos' },
      { key: 'delivered', label: 'Volume entregue', value: fmt.pct(ratio(received, contracted)), progress: ratio(received, contracted), note: `${fmt.tonnes(received)} de ${fmt.tonnes(contracted)}`, href: '/contratos?view=deliveries' },
      { key: 'margin', label: 'Margem projetada', value: fmt.moneyShort(i.projectedMarginAmount), note: sacks > 0 ? `${fmt.perSc(num(i.projectedMarginAmount) / sacks)} em média` : 'sem contratos ativos', href: '/contratos?view=economics', tip: `Margem projetada\n${fmt.money(i.projectedMarginAmount)}` },
      { key: 'obligations', label: 'Obrigações abertas', value: fmt.int(open), tone: critical(overdue), note: overdue ? plural(overdue, 'vencida', 'vencidas') : 'nenhuma vencida', href: '/contratos/obrigacoes' },
      { key: 'due', label: 'Vencem em 30 dias', value: fmt.int(i.obligationsDue_30Days), note: 'obrigações com prazo próximo', href: '/contratos/obrigacoes' },
      { key: 'formalization', label: 'Formalização pendente', value: fmt.int(formalization), tone: attention(formalization), note: `${plural(num(i.pendingSignatures), 'assinatura', 'assinaturas')} · ${plural(num(i.pendingDocuments), 'documento', 'documentos')}`, href: '/contratos?view=signatures' },
    ],
    body: (
      <Grid>
        <Panel span={12} title="Cronograma de entrega" subtitle="Janela contratual de cada compra ativa e volume já recebido" action={{ href: '/contratos?view=deliveries', label: 'Ver entregas' }}>
          <Timeline
            today={today}
            empty="Sem contratos de compra ativos."
            rows={delivery.map((row) => {
              const total = num(row.contracted_kg);
              const done = num(row.received_kg);
              return {
                key: text(row.contract_id),
                label: party(row.counterparty),
                sublabel: `${row.external_number ? `${text(row.external_number)} · ` : ''}${commodity(row.commodity)} · ${dates.dayMonth(row.delivery_start)} a ${dates.dayMonth(row.delivery_end)}`,
                start: text(row.delivery_start, ''),
                end: text(row.delivery_end, ''),
                progress: ratio(done, total),
                display: fmt.pct(ratio(done, total)),
                detail: `${fmt.tonnes(done)} de ${fmt.tonnes(total)}`,
                href: `/contratos/${text(row.contract_id)}`,
                tip: `${party(row.counterparty)}\nRecebido: ${fmt.tonnes(done)} de ${fmt.tonnes(total)}\nProgramado: ${fmt.tonnes(row.scheduled_kg)}\nFim da janela: ${dates.dayMonth(row.delivery_end)} (${dates.relative(row.delivery_end, today)})`,
              };
            })}
          />
        </Panel>
        <Panel span={6} title="Próximas obrigações" subtitle="Em ordem de vencimento" action={{ href: '/contratos/obrigacoes', label: 'Ver todas' }}>
          <RecordList
            empty="Nenhuma obrigação em aberto."
            rows={upcoming.map((row) => {
              const due = row.due_date ? dates.relative(row.due_date, today) : 'sem prazo';
              const late = Boolean(row.due_date) && text(row.due_date) < today;
              return {
                key: text(row.id),
                title: text(row.title),
                meta: `${party(row.counterparty)}${row.responsible_name ? ` · ${text(row.responsible_name)}` : ''}`,
                value: row.due_date ? dates.dayMonth(row.due_date) : 'Sem prazo',
                side: [row.status === 'IN_PROGRESS' ? 'em andamento' : null, row.due_date ? due : null].filter(Boolean).join(' · ') || undefined,
                tone: late ? 'critical' as const : undefined,
                href: `/contratos/${text(row.contract_id)}`,
              };
            })}
          />
        </Panel>
        <Panel span={6} title="Margem projetada por contrato" subtitle="Volume contratado × margem por saca" action={{ href: '/contratos?view=economics', label: 'Custos e margem' }}>
          <MarginBars breakdowns={breakdowns} />
        </Panel>
        <Panel span={7} title="Obrigações por prazo" subtitle="Obrigações abertas agrupadas pelo vencimento" action={{ href: '/contratos/obrigacoes', label: 'Ver obrigações' }}>
          <Columns
            label="Obrigações abertas por prazo"
            legend={false}
            empty="Nenhuma obrigação contratual em aberto."
            format={(value) => fmt.int(value)}
            height={160}
            categories={aging.map((row) => {
              const key = text(row.key);
              const [label, sublabel] = agingNames[key] ?? [key, ''];
              const late = key.startsWith('OVERDUE');
              return {
                key, label, sublabel,
                values: { late: late ? num(row.obligations) : 0, open: late ? 0 : num(row.obligations) },
                tip: `${label} ${sublabel}\n${plural(num(row.obligations), 'obrigação', 'obrigações')}`,
              };
            })}
            series={[
              { key: 'late', label: 'Vencidas', color: palette.critical },
              { key: 'open', label: 'A vencer', color: palette.primary },
            ]}
          />
        </Panel>
        <Panel span={5} title="Carteira por situação" subtitle="Todos os contratos de compra" action={{ href: '/contratos', label: 'Ver lista' }}>
          <SegmentBar
            legend="rows"
            empty="Nenhum contrato registrado."
            segments={mix.map((row) => ({
              key: text(row.status),
              label: statusNames[text(row.status)] ?? text(row.status),
              value: num(row.contracts),
              color: statusColors[text(row.status)] ?? palette.muted,
              display: fmt.int(row.contracts),
            }))}
          />
        </Panel>
      </Grid>
    ),
  };
}
