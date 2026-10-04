export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite" aria-label="Carregando página">
      <div className="route-loading-header" />
      <div className="route-loading-subnav" />
      <div className="route-loading-content">
        <span className="route-loading-eyebrow" />
        <span className="route-loading-title" />
        <span className="route-loading-line" />
        <div className="route-loading-grid"><span /><span /><span /></div>
        <p>Carregando página…</p>
      </div>
    </div>
  );
}
