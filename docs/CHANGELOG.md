# Changelog

## Ainda não lançado

### Documentação

- Definido o contrato de produto do MVP.
- Registadas as regras de domínio financeiro e decisões de arquitectura.
- Especificados o desenho de dados, segurança multiutilizador e roadmap de sprints.
- Adicionados guia de passagem e instruções de projecto para Claude Code.

### Fundação técnica

- Inicializada aplicação Next.js com TypeScript, App Router, Tailwind CSS e ESLint.
- Adicionadas as dependências `@supabase/supabase-js` e `@supabase/ssr`.
- Criados clientes Supabase separados para browser (`src/lib/supabase/client.ts`) e servidor (`src/lib/supabase/server.ts`).
- Adicionada renovação de sessão SSR no proxy (`src/proxy.ts` com o auxiliar `src/lib/supabase/session.ts`), substituindo a convenção `middleware` depreciada no Next.js 16.
- Adicionado `.env.example` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, sem valores reais.
- Criada a primeira migração (`supabase/migrations/20260715120000_profiles.sql`): tabela `profiles`, RLS, políticas por utilizador e criação automática de perfil por trigger. Sem tabelas financeiras.
- Instalada a Supabase CLI como dependência de desenvolvimento; projecto de desenvolvimento ligado e migração `profiles` aplicada via `supabase db push`.
- Ignorado `supabase/.temp/` (estado local da CLI) no Git.
