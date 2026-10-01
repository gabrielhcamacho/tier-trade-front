# Tier Trade Web

Interface Next.js App Router conectada à primeira vertical slice da API. Não contém dados de negócio simulados: sem API e identidade configuradas, o envio permanece indisponível.

Use Node 22+, copie `.env.example` para `.env.local`, instale as dependências e execute `pnpm dev`.

Com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, a aplicação usa sessão SSR em cookies, login, logout e recuperação de senha. Sem essas variáveis, o modo local mantém os cabeçalhos de desenvolvimento; esse fallback não funciona na API em produção.

A tela seleciona contrapartes do tenant, versiona a política de margem, recalcula rascunhos preservando cenários anteriores e cancela ofertas antes da ativação do contrato.

Enquanto o pacote ainda não é publicado, a dependência do design system aponta para o repositório irmão. Ao configurar o GitHub, defina a variável `DESIGN_SYSTEM_REPOSITORY` como `organização/repositório` para o pipeline fazer o segundo checkout.
