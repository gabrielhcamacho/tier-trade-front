export function ReportFilterBar({ action, types, defaultType, criterionPlaceholder = 'Status, referência, contraparte…' }: {
  action: string;
  types: Array<{ value: string; label: string }>;
  defaultType: string;
  criterionPlaceholder?: string;
}) {
  return (
    <form className="report-filter-bar" action={action} method="get" target="_blank">
      <label><span>Relatório</span><select name="tipo" defaultValue={defaultType}>{types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
      <label><span>De</span><input type="date" name="de" /></label>
      <label><span>Até</span><input type="date" name="ate" /></label>
      <label className="report-criterion"><span>Critério</span><input name="criterio" maxLength={120} placeholder={criterionPlaceholder} /></label>
      <button type="submit">Exportar CSV</button>
    </form>
  );
}
