export type InventoryLot = {
  id: string;
  lotCode: string;
  sourceLoadId: string;
  contractId: string;
  contractVersionNumber: number;
  location: { code: string; name: string };
  commodity: string;
  status: string;
  ownershipStatus: string;
  riskStatus: string;
  custodyStatus: string;
  quantityKg: string;
  committedKg: string;
  availableKg: string;
  owner: { id: string; name: string | null } | null;
  custodian: { id: string; name: string | null } | null;
  quality: { moisturePct: string; impurityPct: string; damagedPct: string;
    brokenPct?: string; burntPct?: string; heatDamagedPct?: string };
  vehiclePlate: string;
  createdAt: string;
};

export type InventoryMovement = {
  id: string;
  lotId: string;
  lotCode: string;
  sourceLoadId: string | null;
  sourceReceiptId: string | null;
  allocationId: string | null;
  dispatchId: string | null;
  type: string;
  quantityDeltaKg: string;
  occurredAt: string;
  recordedAt: string;
};

export type InventoryPosition = {
  tenant: {
    legalName: string;
    isDemo: boolean;
    demoSeedVersion: number | null;
  };
  summary: {
    physicalWeightKg: string;
    availableWeightKg: string;
    blockedWeightKg: string;
    committedWeightKg: string;
    lotCount: number;
    pendingOwnershipCount: number;
  };
  lots: InventoryLot[];
  movements: InventoryMovement[];
  salesContracts: Array<{
    id: string; counterparty_id: string; reference: string; commodity: string; quantity_kg: string;
    sale_price_per_kg: string; destination_code: string; delivery_start: string;
    delivery_end: string; required_documents: string[]; payment_term_days: number | null; status: string;
    counterparty_name: string; version_number: number; allocated_kg: string; dispatched_kg: string;
  }>;
  allocations: Array<{
    id: string; sales_contract_id: string; sales_contract_version_number: number; lot_id: string; quantity_kg: string;
    status: string; contract_reference: string; lot_code: string; dispatched_kg: string;
  }>;
  dispatches: Array<{
    id: string; allocation_id: string; sales_contract_version_number: number; quantity_kg: string; dispatched_at: string;
    vehicle_plate: string; document_reference: string; notes: string | null;
    contract_reference: string; lot_code: string;
    destination_receipt_id: string | null; destination_receipt_version: number | null;
    destination_weight_kg: string | null; unloaded_at: string | null; terminal_code: string | null;
    ticket_reference: string | null; destination_document_reference: string | null;
    destination_receipt_reason: string | null; destination_receipt_notes: string | null;
    destination_difference_kg: string | null;
  }>;
  economicReconciliations: Array<{
    dispatch_id: string; dispatched_at: string; dispatch_document_reference: string;
    dispatched_weight_kg: string; source_load_id: string; purchase_contract_id: string;
    purchase_contract_version_number: number; sales_contract_id: string;
    sales_contract_version_number: number; sales_contract_reference: string;
    counterparty_name: string; lot_code: string; destination_weight_kg: string | null;
    ticket_reference: string | null; financial_event_id: string | null;
    revenue_calculation_status: string | null; revenue_amount: string | null;
    purchase_financial_event_id: string | null; allocated_acquisition_cost_amount: string | null;
    allocated_component_impact_amount: string | null; operational_margin_amount: string | null;
    fiscal_document_id: string | null; fiscal_document_number: string | null;
    fiscal_document_status: string | null; fiscal_document_amount: string | null;
    title_id: string | null; title_number: string | null; title_status: string | null;
    due_date: string | null; title_amount: string | null; settled_amount: string;
    outstanding_amount: string | null;
  }>;
  deliveryRequirementPolicies: Array<{
    id: string; counterparty_id: string; counterparty_name: string; terminal_code: string;
    requirement_type: 'DESTINATION_TICKET' | 'PORTAL_CONFIRMATION'; version: number; title: string;
    responsible_name: string; due_hours_after_dispatch: number; portal_name: string | null;
    portal_url: string | null; consequence: 'INFORMATIONAL' | 'BLOCK_OPERATIONAL_CLOSURE' | 'BLOCK_ANTICIPATION';
    active: boolean; created_at: string;
  }>;
  deliveryRequirements: Array<{
    id: string; dispatch_id: string; policy_id: string; policy_version: number;
    requirement_type: 'DESTINATION_TICKET' | 'PORTAL_CONFIRMATION'; title: string;
    responsible_name: string; due_at: string; portal_name: string | null; portal_url: string | null;
    consequence: 'INFORMATIONAL' | 'BLOCK_OPERATIONAL_CLOSURE' | 'BLOCK_ANTICIPATION';
    status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WAIVED';
    evidence_reference: string | null; portal_confirmation: string | null; notes: string | null;
    resolution_reason: string | null; submitted_at: string | null; resolved_at: string | null;
    contract_reference: string; counterparty_name: string; terminal_code: string; document_reference: string;
  }>;
  counterparties: Array<{ id: string; legal_name: string }>;
  locations: Array<{ id: string; code: string; name: string; status: string }>;
  transfers: Array<{
    id: string; lot_id: string; lot_code: string; source_location_id: string;
    source_location_code: string; destination_location_id: string;
    destination_location_code: string; status: string; started_at: string;
    completed_at: string | null; reason: string;
  }>;
  counts: Array<{
    id: string; lot_id: string; lot_code: string; system_quantity_kg: string;
    counted_quantity_kg: string; difference_kg: string; occurred_at: string; reason: string;
  }>;
  lotEvents: Array<{
    id: string; lot_id: string; lot_code: string; event_type: string;
    payload: Record<string, unknown>; reason: string; occurred_at: string;
  }>;
};

export type InventoryResult =
  | { data: InventoryPosition; error: null }
  | { data: null; error: string };

export async function loadInventory(
  identityHeaders: Record<string, string>,
): Promise<InventoryResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return { data: null, error: 'A API ou a identidade do ambiente ainda não está configurada.' };
  }
  try {
    const response = await fetch(`${apiUrl}/v1/inventory`, {
      headers: identityHeaders,
      cache: 'no-store',
    });
    if (!response.ok) {
      return { data: null, error: 'A API não conseguiu carregar a posição de estoque.' };
    }
    return { data: await response.json() as InventoryPosition, error: null };
  } catch {
    return { data: null, error: 'Não foi possível acessar a API na porta configurada.' };
  }
}

export function formatTonnes(weightKg: string): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(weightKg) / 1000);
}

export function formatInventoryDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

export function movementLabel(value: string): string {
  if (value === 'RECEIPT') return 'Entrada por recebimento';
  if (value === 'RECEIPT_CORRECTION') return 'Correção de recebimento';
  if (value === 'RECEIPT_REVERSAL') return 'Estorno para revisão';
  if (value === 'DISPATCH') return 'Saída por expedição';
  if (value === 'LOSS') return 'Perda operacional';
  if (value === 'COUNT_ADJUSTMENT') return 'Ajuste por inventário físico';
  return value;
}
