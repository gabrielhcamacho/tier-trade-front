'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ContextNav() {
  const pathname = usePathname();
  return (
    <nav className="context-bar" aria-label="Telas da Central">
      <Link className={pathname === '/central' ? 'active' : undefined} aria-current={pathname === '/central' ? 'page' : undefined} href="/central">Minha fila</Link>
      <Link className={pathname === '/demonstracao' ? 'active' : undefined} aria-current={pathname === '/demonstracao' ? 'page' : undefined} href="/demonstracao">Roteiro de demonstração</Link>
    </nav>
  );
}
