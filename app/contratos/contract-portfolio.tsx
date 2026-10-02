import Link from 'next/link';
import type { ContractListItem, ContractPortfolio } from '../../lib/contracts';
import { commodityLabel, contractStatusLabel, formatCurrency, formatQuantity } from '../../lib/contracts';
import { DemoNotice } from '../demo-notice';
import { DemoMetricStrip, DemoSection, DemoStatus, DemoTable } from '../demo-ui';

export function ContractPortfolioView({ portfolio }: { portfolio: ContractPortfolio }) {
  const active = portfolio.items.filter((contract) => contract.status === 'ACTIVE');
  const totalQuantitySc = portfolio.items.reduce((total, contract) => total + Number(contract.quantity_sc), 0);
  const scheduledWeightKg = portfolio.items.reduce(
    (total, contract) => total + Number(contract.scheduled_weight_kg),
    0,
  );
  const receivedWeightKg = portfolio.items.reduce(
    (total, contract) => total + Number(contract.received_weight_kg),
    0,
  );
  const projectedMargin = portfolio.items.reduce(
    (total, contract) => total + Number(contract.quantity_sc) * Number(contract.projected_margin_per_sc),
    0,
  );
  const pendingObligations = portfolio.items.reduce(
    (total, contract) => total + contract.pending_obligations,
    0,
  );

  return (
    <div className="demo-page demo-workspace">
      {portfolio.tenant.isDemo ? <DemoNotice persisted /> : null}
      <DemoMetricStrip items={[
        {
          label: 'Contratos ativos',
          value: String(active.length),
          detail: `${portfolio.items.length} na carteira`,
          tone: 'primary' as const,
        },
        {
          label: 'Volume contratado',
          value: formatQuantity(String(totalQuantitySc)),
          unit: 'sc',
          detail: 'volume formalizado',
        },
        {
          label: 'Volume programado',
          value: formatWeightTonnes(scheduledWeightKg),
          unit: 't',
          detail: `${formatWeightTonnes(receivedWeightKg)} t recebidas`,
        },
        {
          label: 'Margem projetada',
          value: formatCurrency(String(projectedMargin)),
          detail: `${pendingObligations} obrigações pendentes`,
          tone: pendingObligations > 0 ? 'attention' as const : undefined,
        },
      ]} />

      <div className="demo-main-stack">
        <DemoSection kicker="CARTEIRA" title="Contratos recentes" aside={`${portfolio.items.length} contratos`}>
          <DemoTable
            label="Contratos reais do tenant"
            columns={['Contrato', 'Operação', 'Commodity', 'Contraparte', 'Volume', 'Preço', 'Status']}
            rows={portfolio.items.map((contract) => [
              <Link key={contract.id} href={`/contratos/${contract.id}`}>{contractReference(contract.id)}</Link>,
              'Compra',
              commodityLabel(contract.commodity),
              contract.counterparty_name,
              `${formatQuantity(contract.quantity_sc)} sc`,
              `${formatCurrency(contract.purchase_price_per_sc)}/sc`,
              <DemoStatus key={`${contract.id}-status`} tone={contract.status === 'ACTIVE' ? 'positive' : 'neutral'}>
                {contractStatusLabel(contract.status)}
              </DemoStatus>,
            ])}
          />
        </DemoSection>

        <DemoSection
          kicker="EXECUÇÃO CONTRATUAL"
          title="Obrigações e programação"
          aside="dados atualizados pela API"
          id="obrigacoes"
        >
          <DemoTable
            label="Execução dos contratos"
            columns={['Contrato', 'Cargas', 'Programado', 'Recebido', 'Saldo disponível', 'Obrigações', 'Agenda']}
            rows={portfolio.items.map((contract) => executionRow(contract))}
          />
        </DemoSection>
      </div>
    </div>
  );
}

function executionRow(contract: ContractListItem) {
  return [
    contractReference(contract.id),
    String(contract.load_count),
    `${formatWeightTonnes(Number(contract.scheduled_weight_kg))} t`,
    `${formatWeightTonnes(Number(contract.received_weight_kg))} t`,
    `${formatWeightTonnes(Number(contract.available_weight_kg))} t`,
    contract.pending_obligations === 0 ? 'Em dia' : `${contract.pending_obligations} pendentes`,
    <Link key={`${contract.id}-agenda`} href={`/cargas?contractId=${contract.id}`}>Abrir agenda</Link>,
  ];
}

function contractReference(id: string): string {
  return `CT-${id.slice(-8).toUpperCase()}`;
}

function formatWeightTonnes(weightKg: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
  }).format(weightKg / 1_000);
}
