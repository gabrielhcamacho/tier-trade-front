import { NextResponse } from 'next/server';
import { currentUserContext } from '../../../../lib/current-user';
import { csvResponse } from '../../../../lib/csv';
import { loadContractSummary, loadContractVersions } from '../../../../lib/contracts';

export async function GET(_request: Request, { params }: { params: Promise<{ contractId: string }> }) {
  const [{ contractId }, { identityHeaders }] = await Promise.all([params, currentUserContext()]);
  const [summaryResult, versionsResult] = await Promise.all([
    loadContractSummary(contractId, identityHeaders),
    loadContractVersions(contractId, identityHeaders),
  ]);
  if (summaryResult.error || !summaryResult.summary || versionsResult.error) {
    return NextResponse.json({
      message: summaryResult.error ?? versionsResult.error ?? 'Histórico indisponível.',
    }, { status: 502 });
  }

  const summary = summaryResult.summary;
  const rows: Array<Array<string | number | null>> = [[
    'Contrato', 'Número externo', 'Status atual', 'Commodity', 'Quantidade (sc)',
    'Versão', 'Tipo de alteração', 'Status da versão', 'Motivo', 'Vigência do aditivo',
    'Registrado em', 'Registrado por',
  ]];
  for (const version of versionsResult.versions) rows.push([
    summary.id, summary.purchase_terms?.externalNumber ?? null, summary.status, summary.commodity,
    summary.quantity_sc, version.version_number, version.change_type, version.lifecycle_status,
    version.reason, version.effective_on, version.recorded_at, version.recorded_by,
  ]);

  return csvResponse(`historico-contrato-${summary.id}.csv`, rows);
}
