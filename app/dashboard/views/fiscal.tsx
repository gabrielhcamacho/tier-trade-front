import { BarList, Columns, palette } from '../charts';
import { dates, fmt, list, num, ratio, text } from '../format';
import { Grid, Panel, RecordList } from '../ui';
import { attention, critical, plural, type ViewInput, type ViewOutput } from './types';

const taxNames: Record<string, string> = {
  ICMS: 'ICMS', ICMS_ST: 'ICMS-ST', PIS: 'PIS', COFINS: 'COFINS', FUNRURAL: 'Funrural', SENAR: 'Senar', RAT: 'RAT',
  GILRAT: 'GILRAT', IRRF: 'IRRF', CSLL: 'CSLL', IBS: 'IBS', CBS: 'CBS', FETHAB: 'Fethab', FUNDEINFRA: 'Fundeinfra',
};
const tax = (value: unknown) => taxNames[text(value, '')] ?? text(value);

export function fiscalView({ indicators: i, breakdowns, today }: ViewInput): ViewOutput {
  const documents = list(breakdowns, 'documentsByMonth');
  const components = list(breakdowns, 'openTaxesByComponent');
  const upcoming = list(breakdowns, 'upcomingObligations');
  const taxes = list(breakdowns, 'taxByMonth');

  return {
    kpis: [
      { key: 'pending', label: 'Aguardando validação', value: fmt.int(i.documentsPendingValidation), tone: attention(num(i.documentsPendingValidation)), note: 'documentos recebidos', href: '/fiscal?view=validation' },
      { key: 'validated', label: 'Documentos validados', value: fmt.int(i.validatedDocuments), note: num(i.validatedAmount) > 0 ? `${fmt.moneyShort(i.validatedAmount)} em notas` : 'processamento concluído', href: '/fiscal?view=documents' },
      { key: 'rejected', label: 'Documentos rejeitados', value: fmt.int(i.rejectedDocuments), tone: attention(num(i.rejectedDocuments)), note: 'exigem correção do emissor', href: '/fiscal?view=documents' },
      { key: 'calculations', label: 'Cálculos a aceitar', value: fmt.int(i.calculationsPendingAcceptance), tone: attention(num(i.calculationsPendingAcceptance)), note: 'apurações calculadas', href: '/fiscal?view=taxes' },
      { key: 'open', label: 'Tributos em aberto', value: fmt.moneyShort(i.openObligationAmount), note: plural(num(i.openObligations), 'obrigação', 'obrigações'), href: '/fiscal?view=obligations', tip: `Tributos em aberto\n${fmt.money(i.openObligationAmount)}` },
      { key: 'overdue', label: 'Obrigações vencidas', value: fmt.int(i.overdueObligations), tone: critical(num(i.overdueObligations)), note: 'fora do prazo de recolhimento', href: '/fiscal?view=obligations' },
    ],
    body: (
      <Grid>
        <Panel span={7} title="Documentos fiscais" subtitle="Notas por mês de emissão e situação, últimos seis meses" action={{ href: '/fiscal?view=documents', label: 'Ver documentos' }}>
          <Columns
            label="Documentos fiscais por mês"
            empty="Nenhum documento fiscal nos últimos seis meses."
            format={(value) => fmt.int(value)}
            height={170}
            categories={documents.map((row, index) => ({
              key: text(row.month),
              label: dates.monthYear(row.month),
              emphasis: index === documents.length - 1,
              values: { validated: num(row.validated), received: num(row.received), rejected: num(row.rejected) },
              tip: `${dates.monthYear(row.month)}\nValidados: ${fmt.int(row.validated)}\nAguardando: ${fmt.int(row.received)}\nRejeitados: ${fmt.int(row.rejected)}\nValor: ${fmt.money(row.amount)}`,
            }))}
            series={[
              { key: 'validated', label: 'Validados', color: palette.primary },
              { key: 'received', label: 'Aguardando validação', color: palette.quaternary },
              { key: 'rejected', label: 'Rejeitados', color: palette.attention },
            ]}
          />
        </Panel>
        <Panel span={5} title="Tributos em aberto" subtitle="Valor por componente" action={{ href: '/fiscal?view=obligations', label: 'Ver obrigações' }}>
          <BarList
            empty="Nenhum tributo em aberto."
            rows={components.map((row) => ({
              key: text(row.component_tax),
              label: tax(row.component_tax),
              sublabel: `${plural(num(row.obligations), 'guia', 'guias')}${num(row.overdue) ? ` · ${num(row.overdue)} vencida${num(row.overdue) > 1 ? 's' : ''}` : ''}`,
              value: num(row.amount),
              display: fmt.moneyShort(row.amount),
              color: num(row.overdue) ? palette.critical : palette.primary,
              tip: `${tax(row.component_tax)}\n${fmt.money(row.amount)}`,
            }))}
          />
        </Panel>
        <Panel span={7} title="Apuração de tributos" subtitle="Tributos calculados por mês da operação">
          <Columns
            label="Tributos apurados por mês"
            legend={false}
            empty="Nenhuma apuração nos últimos seis meses."
            format={(value) => fmt.moneyShort(value)}
            height={160}
            categories={taxes.map((row, index) => ({
              key: text(row.month),
              label: dates.monthYear(row.month),
              sublabel: num(row.gross_amount) > 0 ? fmt.pct(ratio(num(row.tax_total), num(row.gross_amount))) : undefined,
              emphasis: index === taxes.length - 1,
              values: { tax: num(row.tax_total) },
              tip: `${dates.monthYear(row.month)}\nTributos: ${fmt.money(row.tax_total)}\nBase: ${fmt.money(row.gross_amount)}\n${plural(num(row.calculations), 'cálculo', 'cálculos')}`,
            }))}
            series={[{ key: 'tax', label: 'Tributos apurados', color: palette.primary }]}
          />
        </Panel>
        <Panel span={5} title="Próximos vencimentos" subtitle="Obrigações fiscais em aberto" action={{ href: '/fiscal?view=obligations', label: 'Ver todas' }}>
          <RecordList
            empty="Nenhuma obrigação fiscal em aberto."
            rows={upcoming.map((row) => ({
              key: text(row.id),
              title: `${tax(row.component_tax)}${row.retained ? ' retido' : ''}`,
              meta: `Competência ${dates.monthYear(row.competence_date)} · ${dates.relative(row.due_date, today)}`,
              value: fmt.money(row.amount),
              side: row.due_date ? `vence ${dates.dayMonth(row.due_date)}` : 'sem vencimento',
              tone: row.due_date && text(row.due_date) < today ? 'critical' as const : undefined,
              href: '/fiscal?view=obligations',
            }))}
          />
        </Panel>
      </Grid>
    ),
  };
}
