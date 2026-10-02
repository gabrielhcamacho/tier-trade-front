export function DemoNotice({ persisted = false }: { persisted?: boolean }) {
  return (
    <aside className="demo-notice" aria-label="Cenário demonstrativo">
      <span aria-hidden="true">D</span>
      <div>
        <strong>Cenário demonstrativo</strong>
        <p>{persisted
          ? 'Dados salvos no backend deste tenant. As alterações são reais, auditadas e isoladas das outras contas.'
          : 'Dados ilustrativos baseados no protótipo aprovado. Nenhuma ação desta tela altera a operação real.'}</p>
      </div>
    </aside>
  );
}
