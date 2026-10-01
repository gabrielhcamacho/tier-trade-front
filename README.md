# Tier Trade Web

Interface Next.js App Router conectada à primeira vertical slice da API. Não contém dados de negócio simulados: sem API e identidade local configuradas, o envio permanece indisponível.

Use Node 22+, copie `.env.example` para `.env.local`, instale as dependências e execute `pnpm dev`.

Enquanto o pacote ainda não é publicado, a dependência do design system aponta para o repositório irmão. Ao configurar o GitHub, defina a variável `DESIGN_SYSTEM_REPOSITORY` como `organização/repositório` para o pipeline fazer o segundo checkout.
