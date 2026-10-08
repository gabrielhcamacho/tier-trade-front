export function ReportFilterBar({ action, types, defaultType, initialFrom, initialTo, initialCriterion, criterionPlaceholder = 'Status, referência, contraparte…' }: {
  action: string;
  types: Array<{ value: string; label: string }>;
  defaultType: string;
  initialFrom?: string;
  initialTo?: string;
  initialCriterion?: string;
  criterionPlaceholder?: string;
}) {
  return (
    <form className="report-filter-bar" action={`/relatorios/${action.split('/')[1]}`} method="get">
      <label><span>Relatório</span><select name="tipo" defaultValue={defaultType}>{types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
      <label><span>De</span><input type="date" name="de" defaultValue={initialFrom} /></label>
      <label><span>Até</span><input type="date" name="ate" defaultValue={initialTo} /></label>
      <label className="report-criterion"><span>Critério</span><input name="criterio" defaultValue={initialCriterion} maxLength={120} placeholder={criterionPlaceholder} /></label>
      <button type="submit">Consultar registros</button>
      <button type="submit" formAction={action} formTarget="_blank" className="report-export-button">Exportar CSV</button>
    </form>
  );
}
