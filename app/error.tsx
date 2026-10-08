'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <section className="route-fallback-state" role="alert">
      <span aria-hidden="true">!</span>
      <p>ERRO INESPERADO</p>
      <h1>Não foi possível abrir esta tela</h1>
      <p>A operação não foi alterada. Tente carregar novamente; se o problema continuar, informe o código abaixo ao suporte.</p>
      {error.digest ? <code>{error.digest}</code> : null}
      <button type="button" onClick={reset}>Tentar novamente</button>
    </section>
  );
}
