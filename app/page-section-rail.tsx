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

  useEffect(() => {
    if (!sections) return;
    const available = sections.filter(({ id }) => document.getElementById(id));
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

  if (!sections) return null;

  return (
    <nav
      className="page-section-rail"
      data-expanded={expanded ? 'true' : undefined}
      aria-label="Atalhos desta página"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}
    >
      <button type="button" className="page-section-rail-trigger" aria-expanded={expanded} aria-controls="page-section-rail-links" aria-label={expanded ? 'Recolher atalhos' : 'Mostrar atalhos desta página'} onClick={() => setExpanded((current) => window.matchMedia('(hover: hover)').matches ? true : !current)}>
        <span aria-hidden="true">{sections.map(({ id }) => <i key={id} data-active={activeId === id ? 'true' : undefined} />)}</span>
      </button>
      <div id="page-section-rail-links" className="page-section-rail-links" aria-hidden={!expanded}>
        <strong>Nesta página</strong>
        {sections.map(({ id, label }) => (
          <a key={id} href={`#${id}`} tabIndex={expanded ? 0 : -1} aria-current={activeId === id ? 'location' : undefined} onClick={() => { setActiveId(id); setExpanded(false); }}>
            <span aria-hidden="true" />{label}
          </a>
        ))}
      </div>
    </nav>
  );
}
