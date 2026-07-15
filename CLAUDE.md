# Instruções para Claude Code — Despact

## Leitura obrigatória, por esta ordem

1. `docs/PROJECT_CONTEXT.md` — fonte de verdade para visão, âmbito e roadmap.
2. `docs/HANDOFF_CLAUDE_CODE.md` — estado exacto da passagem e próximo passo autorizado.
3. `docs/DECISIONS.md` e `docs/DATABASE.md` — regras de domínio e dados que não devem ser reinterpretadas.
4. `docs/ARCHITECTURE.md`, `docs/PRODUCT.md` e `docs/ROADMAP.md` — arquitectura, fluxos e critérios de saída.

Se houver conflito, `PROJECT_CONTEXT.md` prevalece para visão/âmbito; `DECISIONS.md` prevalece para decisões de domínio já fechadas.

## Forma de trabalhar

- Comunicar em português de Portugal.
- Trabalhar incrementalmente: explicar arquitectura, decisão e trade-offs antes de alterar código ou dependências.
- Implementar apenas o sprint em curso. Não antecipar contas, transacções, dashboard, IA, Open Banking ou qualquer funcionalidade fora do sprint.
- Preservar alterações existentes do utilizador; verificar `git status` antes de editar.
- Manter TypeScript estrito. Não usar `any` para contornar erros.
- Preferir componentes de servidor. Usar componentes cliente apenas para interacção, estado local ou APIs do browser.
- Manter regras de domínio fora de componentes de interface.
- Executar `npm run lint` e `npm run build` depois de alterações relevantes.

## Regras financeiras não negociáveis

- Dinheiro é um inteiro em unidades mínimas e tem código ISO 4217; nunca usar `float`.
- Saldo = saldo inicial + soma de movimentos.
- Activos usam valores tipicamente positivos; dívidas, incluindo cartões de crédito, negativos.
- Receita é positiva, despesa negativa e transferência é um par atómico de movimentos ligados.
- Cada dado financeiro pertence a um utilizador. RLS é obrigatória e não pode ser substituída por verificações no cliente.
- Insights do MVP são determinísticos e explicáveis; não são uma tabela persistida nem uma funcionalidade de IA.

## Segurança e ambientes

- Nunca versionar segredos, tokens ou ficheiros `.env*` locais.
- Nunca expor a chave Supabase `service_role` ao browser ou usá-la para operações normais.
- Usar a integração SSR actual do Supabase, com clientes distintos para servidor e browser.
- Todas as tabelas de domínio devem ter `user_id`, RLS e políticas que usem `auth.uid()`.

## Estado actual

- O Sprint 0 está concluído e documentado.
- O Sprint 1 começou: existe uma aplicação Next.js 16.2.10 mínima, sem autenticação ou Supabase.
- O próximo passo é configurar ambientes e Supabase de forma segura; consultar o handoff antes de agir.
