import { BarList, Columns, Empty, Legend, SegmentBar, palette } from '../charts';
import { commodity, dates, fmt, hasValue, list, num, party, ratio, text } from '../format';
import { Grid, Panel } from '../ui';
import styles from '../dashboard.module.css';
import { attention, type ViewInput, type ViewOutput } from './types';

const stageNames: Record<string, string> = {
  DRAFT: 'Rascunho', IN_APPROVAL: 'Em aprovação', APPROVED: 'Aprovada', CONVERTED: 'Convertida em contrato', CANCELLED: 'Cancelada',
};

export function commercialView({ indicators: i, breakdowns }: ViewInput): ViewOutput {
  const decided = num(i.decidedLast_90Days);
  const converted = num(i.convertedLast_90Days);
  const funnel = list(breakdowns, 'offerFunnel');
  const activity = list(breakdowns, 'activityByWeek');
  const bridge = list(breakdowns, 'priceBridgeByCommodity');
  const demand = list(breakdowns, 'openDemandByCommodity');
  const parties = list(breakdowns, 'topCounterparties');
  const partyMax = Math.max(1, ...parties.map((row) => num(row.quantity_sc)));

  return {
    kpis: [
      { key: 'open', label: 'Ofertas em aberto', value: fmt.int(i.openOffers ?? num(i.draftOffers) + num(i.pendingApprovals) + num(i.approvedOffers)), note: hasValue(i.openOfferQuantitySc) ? `${fmt.sacks(i.openOfferQuantitySc)} em negociação` : 'rascunho, aprovação e aprovadas', href: '/ofertas' },
      { key: 'approval', label: 'Aguardando aprovação', value: fmt.int(i.pendingApprovals), tone: attention(num(i.pendingApprovals)), note: 'dependem de alçada', href: '/ofertas' },
      { key: 'conversion', label: 'Conversão em 90 dias', value: decided ? fmt.pct(ratio(converted, decided)) : '—', note: decided ? `${converted} de ${decided} ofertas decididas` : 'nenhuma oferta decidida no período', href: '/ofertas' },
      { key: 'margin', label: 'Margem média projetada', value: hasValue(i.averageMarginPerSc) ? fmt.perSc(i.averageMarginPerSc) : '—', note: 'ofertas submetidas em 90 dias', href: '/comercial/politica-margem' },
      { key: 'demands', label: 'Demandas abertas', value: fmt.int(i.openDemands), note: `${fmt.sacks(i.openDemandQuantitySc)} demandadas`, href: '/comercial/demandas' },
      { key: 'negotiations', label: 'Negociações em 7 dias', value: fmt.int(i.negotiationsLast_7Days), note: 'registros de negociação', href: '/comercial/negociacoes' },
    ],
    body: (
      <Grid>
        <Panel span={5} title="Funil de ofertas" subtitle="Ofertas criadas nos últimos 90 dias, por situação" action={{ href: '/ofertas', label: 'Ver ofertas' }}>
          <BarList
            empty="Nenhuma oferta criada nos últimos 90 dias."
            keepZero
            max={Math.max(1, ...funnel.map((row) => num(row.offers)))}
            rows={funnel.map((row) => ({
              key: text(row.status),
              label: stageNames[text(row.status)] ?? text(row.status),
              sublabel: fmt.sacks(row.quantity_sc),
              value: num(row.offers),
              display: fmt.int(row.offers),
              color: row.status === 'CANCELLED' ? palette.muted : palette.primary,
              tip: `${stageNames[text(row.status)] ?? text(row.status)}\n${fmt.int(row.offers)} ofertas · ${fmt.sacks(row.quantity_sc)}`,
            }))}
          />
        </Panel>
        <Panel span={7} title="Formação do preço por commodity" subtitle="Média ponderada por volume, ofertas dos últimos 180 dias" action={{ href: '/comercial/politica-margem', label: 'Política de margem' }}>
          {bridge.length ? (
            <div className={styles.stackRows}>
              {bridge.map((row) => (
                <SegmentBar
                  key={text(row.commodity)}
                  title={`${commodity(row.commodity)} · referência de venda ${fmt.perSc(row.sale_reference_per_sc)} · ${fmt.sacks(row.quantity_sc)}`}
                  segments={[
                    { key: 'purchase', label: 'Preço de compra', value: num(row.purchase_price_per_sc), color: palette.quaternary, display: fmt.perSc(row.purchase_price_per_sc) },
                    { key: 'costs', label: 'Custos', value: num(row.total_costs_per_sc), color: palette.tertiary, display: fmt.perSc(row.total_costs_per_sc) },
                    { key: 'margin', label: 'Margem projetada', value: Math.max(0, num(row.margin_per_sc)), color: palette.primary, display: fmt.perSc(row.margin_per_sc) },
                  ]}
                />
              ))}
            </div>
          ) : <Empty>Sem cenários de preço nos últimos 180 dias.</Empty>}
        </Panel>
        <Panel span={8} title="Atividade comercial" subtitle="Registros criados por semana, últimas 12 semanas">
          <Columns
            label="Atividade comercial por semana"
            empty="Nenhuma oferta, demanda ou negociação registrada nas últimas 12 semanas."
            format={(value) => fmt.int(value)}
            categories={activity.map((row, index) => ({
              key: text(row.week),
              label: dates.numeric(row.week),
              emphasis: index === activity.length - 1,
              values: { offers: num(row.offers), demands: num(row.demands), negotiations: num(row.negotiations) },
              tip: `Semana de ${dates.dayMonth(row.week)}\nOfertas: ${fmt.int(row.offers)}\nDemandas: ${fmt.int(row.demands)}\nNegociações: ${fmt.int(row.negotiations)}`,
            }))}
            series={[
              { key: 'offers', label: 'Ofertas', color: palette.primary },
              { key: 'demands', label: 'Demandas', color: palette.secondary },
              { key: 'negotiations', label: 'Negociações', color: palette.quaternary },
            ]}
          />
        </Panel>
        <Panel span={4} title="Demanda aberta" subtitle="Volume por commodity e direção" action={{ href: '/comercial/demandas', label: 'Ver demandas' }}>
          {demand.length ? (
            <div className={styles.stackRows}>
              {demand.map((row) => (
                <SegmentBar
                  key={text(row.commodity)}
                  title={`${commodity(row.commodity)} · ${fmt.sacks(row.quantity_sc)}`}
                  legend={false}
                  segments={[
                    { key: 'purchase', label: 'Compra', value: num(row.purchase_sc), color: palette.primary, display: fmt.sacks(row.purchase_sc) },
                    { key: 'sale', label: 'Venda', value: num(row.sale_sc), color: palette.tertiary, display: fmt.sacks(row.sale_sc) },
                  ]}
                />
              ))}
              <Legend items={[{ label: 'Compra', color: palette.primary }, { label: 'Venda', color: palette.tertiary }]} />
            </div>
          ) : <Empty>Nenhuma demanda aberta.</Empty>}
        </Panel>
        <Panel span={12} title="Principais contrapartes" subtitle="Volume ofertado nos últimos 180 dias" action={{ href: '/comercial/carteira', label: 'Ver carteira' }}>
          {parties.length ? (
            <table className={styles.table}>
              <thead><tr><th>Contraparte</th><th>Ofertas</th><th>Convertidas</th><th>Volume</th><th aria-label="Participação" /></tr></thead>
              <tbody>
                {parties.map((row) => (
                  <tr key={text(row.id)}>
                    <td><strong>{party(row.name)}</strong></td>
                    <td>{fmt.int(row.offers)}</td>
                    <td>{fmt.int(row.converted)}</td>
                    <td>{fmt.sacks(row.quantity_sc)}</td>
                    <td className={styles.tableBar}><span><i style={{ width: `${(num(row.quantity_sc) / partyMax) * 100}%` }} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty>Nenhuma oferta nos últimos 180 dias.</Empty>}
        </Panel>
      </Grid>
    ),
  };
}
