# Implantação do frontend

## Artefato

O repositório é autossuficiente para build. O design system permanece com Git próprio e entra no frontend como snapshot versionado em `vendor/`. Quando houver um registry privado, o snapshot pode ser substituído pelo mesmo pacote sem alterar imports.

Há duas formas equivalentes de implantação:

- Vercel, usando o workflow manual `deploy-web` e artefato prebuilt;
- container OCI, usando o `Dockerfile` standalone.

## Variáveis públicas de build

- `NEXT_PUBLIC_API_URL`: origem HTTPS pública da API, sem barra final.
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase do ambiente.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publicável do mesmo projeto.

Nenhum segredo de backend pode usar o prefixo `NEXT_PUBLIC_`.

## GitHub Environments

Crie os ambientes protegidos `preview` e `production`. Em ambos configure:

- `VERCEL_TOKEN`;
- `VERCEL_ORG_ID`;
- `VERCEL_PROJECT_ID`.

As variáveis públicas são mantidas no próprio projeto Vercel por ambiente. Produção deve exigir aprovação manual no GitHub Environment até o checklist de lançamento ser encerrado.

## Verificação

- build: `pnpm typecheck && pnpm build`;
- container: `docker build -t tier-trade-web .`;
- sonda: `GET /health`, resposta HTTP 200 sem autenticação;
- login e callback devem usar apenas URLs cadastradas no Supabase Auth.

## Rollback

Na Vercel, promova novamente o último deployment validado. Em container, aponte o serviço para a tag imutável do commit anterior. Rollback do frontend não desfaz migrations.
