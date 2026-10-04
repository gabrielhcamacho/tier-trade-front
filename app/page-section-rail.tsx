'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type PageSection = { id: string; label: string };

const sectionsByPath: Record<string, PageSection[]> = {
  '/central': [
    { id: 'fila', label: 'Minha fila' },
    { id: 'aprovacoes', label: 'Aprovações' },
    { id: 'alertas', label: 'Alertas' },
  ],
  '/': [
    { id: 'nova-oferta', label: 'Nova oferta' },
    { id: 'politica-margem', label: 'Política de margem' },
  ],
  '/estoque': [
    { id: 'execucao-venda', label: 'Execução de venda' },
    { id: 'posicao-estoque', label: 'Posição de estoque' },
    { id: 'lotes', label: 'Lotes' },
    { id: 'movimentos', label: 'Movimentos' },
    { id: 'reconciliacao', label: 'Reconciliação' },
  ],
  '/risco': [
    { id: 'exposicao', label: 'Exposição' },
    { id: 'cobertura', label: 'Cobertura' },
    { id: 'limites', label: 'Limites' },
  ],
  '/financeiro': [
    { id: 'acoes', label: 'Operação financeira' },
    { id: 'acoes-pagar', label: 'Pagamentos' },
    { id: 'liquidacoes', label: 'Previsões' },
    { id: 'receber', label: 'Contas a receber' },
    { id: 'pagar', label: 'Contas a pagar' },
    { id: 'conciliacao', label: 'Recebimentos' },
  ],
  '/fiscal': [
    { id: 'estabelecimentos', label: 'Estabelecimentos' },
    { id: 'configuracoes', label: 'Configurações' },
    { id: 'calculo', label: 'Cálculo' },
    { id: 'obrigacoes', label: 'Obrigações' },
    { id: 'entrada', label: 'Entrada fiscal' },
    { id: 'documentos', label: 'Documentos' },
  ],
};

export function PageSectionRail() {
  const pathname = usePathname();
  const sections = sectionsByPath[pathname];
  const [activeId, setActiveId] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [availableIds, setAvailableIds] = useState<string[]>([]);

  useEffect(() => {
    if (!sections) { setAvailableIds([]); return; }
    const available = sections.filter(({ id }) => document.getElementById(id));
    setAvailableIds(available.map(({ id }) => id));
    if (available.length < 2) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const threshold = Math.min(230, window.innerHeight * 0.35);
        const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
        if (atBottom) {
          const lastVisible = available.filter(({ id }) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) < window.innerHeight - 80).at(-1);
          if (lastVisible) { setActiveId(lastVisible.id); return; }
        }
        const reached = available.map(({ id }) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Infinity }))
          .filter(({ top }) => top <= threshold)
          .sort((left, right) => right.top - left.top);
        setActiveId(reached[0]?.id ?? available[0].id);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [sections]);

  const visibleSections = sections?.filter(({ id }) => availableIds.includes(id));
  if (!visibleSections || visibleSections.length < 2) return null;

  return (
    <nav
      className="page-section-rail"
      data-expanded={expanded ? 'true' : undefined}
      aria-label="Atalhos desta página"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}
    >
      <button type="button" className="page-section-rail-trigger" aria-expanded={expanded} aria-controls="page-section-rail-links" aria-label="Mostrar atalhos desta página" onClick={() => setExpanded((current) => window.matchMedia('(hover: hover)').matches ? true : !current)}>
        <span aria-hidden="true">≡</span><span className="page-section-rail-heading">Nesta página</span>
      </button>
      <div id="page-section-rail-links" className="page-section-rail-links">
        {visibleSections.map(({ id, label }) => (
          <a key={id} href={`#${id}`} aria-label={label} title={expanded ? undefined : label} aria-current={activeId === id ? 'location' : undefined} onClick={(event) => {
            const section = document.getElementById(id);
            if (!section) return;
            event.preventDefault();
            window.history.replaceState(null, '', `#${id}`);
            section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
            setActiveId(id);
            setExpanded(false);
          }}>
            <span className="page-section-rail-mark" aria-hidden="true" /><span className="page-section-rail-label">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
