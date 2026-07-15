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

### Autenticação

- Páginas públicas de início de sessão (`/login`) e registo (`/signup`) como componentes de servidor, com Server Actions para login, registo e logout.
- Confirmação de e-mail via route handler `/auth/confirm` (`verifyOtp` com `token_hash`).
- Protecção de rotas no proxy: sem sessão, caminhos privados redireccionam para `/login`; com sessão, `/login` e `/signup` redireccionam para `/`.
- Página inicial autenticada mínima com identificação do utilizador e terminar sessão; revalida a sessão no servidor.
- Metadata da aplicação actualizada (título "Despact", `lang="pt"`).

### Deploy — Sprint 1 concluído

- Projecto Vercel ligado ao repositório GitHub; produção em `https://despact.vercel.app`, previews automáticos por branch.
- Variáveis de ambiente separadas no painel Vercel: produção usa o projecto Supabase de produção; previews usam o de desenvolvimento.
- Projecto Supabase de produção criado; migração `profiles` aplicada pela mesma ordem via CLI.
- Confirmação de e-mail desactivada em ambos os ambientes até haver SMTP (pendência registada no handoff).
- Critérios de saída do Sprint 1 verificados: sessão, protecção de rotas, builds e ausência de segredos no repositório.

### Sprint 2 — núcleo financeiro (dados)

- Migração `financial_core`: enums, tabelas `accounts`, `categories` e `transactions` com dinheiro em `bigint` de unidades mínimas (D-001) e saldo derivado (D-002).
- Integridade entre linhas na base de dados: chaves compostas `(id, user_id)` impedem referências entre utilizadores; trigger valida moeda da conta, conta não arquivada e categoria de tipo compatível.
- Regras de forma por tipo (D-003) como `CHECK`: receita positiva, despesa negativa, transferência sem categoria e com `transfer_id`.
- Funções atómicas `create_transfer`/`delete_transfer` com `SECURITY INVOKER` (RLS aplica-se a quem chama).
- RLS nas três tabelas; contas e categorias sem política de DELETE (arquivam-se), transacções elimináveis.
- Aplicada ao ambiente de desenvolvimento; produção recebe-a no fecho do sprint.
