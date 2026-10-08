import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="route-fallback-state">
      <span aria-hidden="true">404</span>
      <p>PÁGINA NÃO ENCONTRADA</p>
      <h1>Este endereço não está disponível</h1>
      <p>O registro pode ter sido removido, pertencer a outra empresa ou o endereço pode estar incorreto.</p>
      <Link href="/central">Voltar à visão geral</Link>
    </section>
  );
}
