export type InventoryLot = {
  id: string;
  lotCode: string;
  sourceLoadId: string;
  contractId: string;
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
    counterparty_name: string; allocated_kg: string; dispatched_kg: string;
  }>;
  allocations: Array<{
    id: string; sales_contract_id: string; lot_id: string; quantity_kg: string;
    status: string; contract_reference: string; lot_code: string; dispatched_kg: string;
  }>;
  dispatches: Array<{
    id: string; allocation_id: string; quantity_kg: string; dispatched_at: string;
    vehicle_plate: string; document_reference: string; notes: string | null;
    contract_reference: string; lot_code: string;
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
