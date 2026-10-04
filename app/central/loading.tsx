export default function CentralLoading() {
  return <main className="overview-dashboard overview-loading" role="status" aria-live="polite" aria-label="Carregando visão geral">
    <div className="overview-loading-head"><span /><span /><span /></div>
    <div className="overview-loading-kpis">{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div>
    <div className="overview-loading-content"><div><span /><span /></div><span /></div>
    <p>Atualizando a visão geral…</p>
  </main>;
}
