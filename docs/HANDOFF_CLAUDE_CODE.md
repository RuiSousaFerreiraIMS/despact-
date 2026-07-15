# Passagem para Claude Code

## Objectivo desta passagem

Permitir que o Claude Code continue o Despact sem voltar a decidir requisitos já fechados, sem ampliar o âmbito e sem expor credenciais.

## Estado exacto em 15 de Julho de 2026

### Concluído

- Sprint 0: contexto, produto, decisões de domínio, arquitectura, desenho de dados, roadmap e changelog.
- Início do Sprint 1: aplicação Next.js mínima criada na raiz.
- Sprint 1 — base Supabase (código, sem ligação a projecto real ainda):
  - Dependências `@supabase/supabase-js` e `@supabase/ssr` instaladas.
  - Clientes separados em `src/lib/supabase/client.ts` (browser) e `src/lib/supabase/server.ts` (servidor).
  - Renovação de sessão SSR em `src/proxy.ts` + `src/lib/supabase/session.ts`.
  - `.env.example` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (sem valores).
  - Migração `supabase/migrations/20260715120000_profiles.sql`: `profiles`, RLS, políticas e trigger de criação de perfil. Ainda **não aplicada** a nenhum projecto.
- Validações executadas com sucesso após cada alteração:
  - `npm run lint`
  - `npm run build`

### Base técnica instalada

| Área | Estado |
| --- | --- |
| Node.js local | 24.14.0 usado durante a inicialização; Next.js requer pelo menos 20.9. |
| Gestor de pacotes | npm, com `package-lock.json` versionado. |
| Framework | Next.js 16.2.10, React 19.2.4, App Router e Turbopack. |
| Linguagem | TypeScript estrito. |
| Interface | Tailwind CSS 4; shadcn/ui ainda não instalado. |
| Qualidade | ESLint configurado; lint e build passam. |
| Supabase (código) | Clientes browser/servidor e renovação de sessão SSR criados; `@supabase/ssr` e `@supabase/supabase-js` instalados. Falta ligar a um projecto real. |
| Supabase/Auth | Fluxo de autenticação (login/registo/logout) ainda não implementado. |
| Base de dados/migrações | Migração `profiles` escrita e versionada; ainda não aplicada a nenhum projecto. Estratégia: Supabase CLI, ficheiros versionados. |
| Ambientes | Estratégia acordada: projecto Supabase de desenvolvimento agora (também usado por previews); projecto de produção criado no passo de deploy. |
| Deploy Vercel | Ainda não configurado. |

### Ficheiros relevantes

| Ficheiro | Função |
| --- | --- |
| `docs/PROJECT_CONTEXT.md` | Fonte de verdade da visão, âmbito e roadmap. |
| `docs/PRODUCT.md` | Fluxos e critérios do MVP. |
| `docs/DECISIONS.md` | Decisões de domínio já tomadas. |
| `docs/ARCHITECTURE.md` | Fronteiras da aplicação e segurança. |
| `docs/DATABASE.md` | Modelo relacional planeado, RLS e integridade. |
| `docs/ROADMAP.md` | Critérios de saída de cada sprint. |
| `CLAUDE.md` | Instruções operacionais que Claude Code deve seguir automaticamente. |

## Limites do trabalho actual

Não existem ainda contas, transacções, categorias, objectivos, painel, cálculos de património, insights, componentes shadcn/ui, tabelas de domínio ou migrações financeiras. Estes itens não devem ser antecipados no Sprint 1.

O esqueleto apresenta intencionalmente uma página mínima. Não deve ser transformado num dashboard antes do Sprint 3.

## Decisões que não devem ser reabertas sem instrução explícita

1. Montantes financeiros são inteiros de unidades mínimas, com código ISO 4217.
2. O saldo deriva do saldo inicial e da soma de movimentos; não é uma cópia persistida.
3. Transferências são pares atómicos de movimentos e são neutras para património.
4. Categorias são pessoais, simples e separadas por receita/despesa no MVP.
5. Objectivos têm progresso manual no MVP e não reservam dinheiro em contas.
6. Insights são cálculos determinísticos e explicáveis, não IA.
7. A aplicação é multiutilizador desde o início: `user_id`, RLS e `auth.uid()` são obrigatórios.
8. É usado Next.js App Router, componentes de servidor por defeito e Server Actions para mutações internas.

Consultar `DECISIONS.md`, `ARCHITECTURE.md` e `DATABASE.md` para justificação e detalhe.

## Sprint 1 — ambientes e Supabase: estado

O sub-passo de ambientes e base Supabase está concretizado no código:

1. ~~Instalar `@supabase/supabase-js` e `@supabase/ssr`~~ — feito.
2. ~~`.env.example` sem valores, com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`~~ — feito.
3. ~~Clientes separados para browser e servidor sob `src/lib/supabase/`~~ — feito.
4. ~~Primeira migração de identidade/perfil (`profiles`, RLS, políticas)~~ — escrita e versionada.
5. ~~Renovação de sessão SSR~~ — feita no `src/proxy.ts` (convenção `proxy` do Next.js 16).

### Ligação ao projecto real — concluída

1. ~~Criar um projecto Supabase de desenvolvimento~~ — criado; URL e chave publicável estão apenas no `.env.local` (nunca em Git, chat ou documentação). O projecto de produção fica para o passo de deploy.
2. ~~Ligar a Supabase CLI e aplicar a migração `profiles`~~ — CLI instalada como dependência de desenvolvimento (`npx supabase`), projecto ligado (`supabase link`) e migração aplicada (`supabase db push`); histórico local e remoto sincronizados (`supabase migration list`).
3. ~~Validar a ligação em execução~~ — servidor de desenvolvimento arrancou com `.env.local`, o proxy contactou o Supabase real (`auth.getUser`) e a página respondeu 200 sem erros.
4. `supabase/.temp/` (estado local da CLI) foi adicionado ao `.gitignore`.

## Próximo passo autorizado — Sprint 1: autenticação

Com o projecto de desenvolvimento ligado, a migração aplicada e a ligação validada:

1. Implementar registo, início e fim de sessão com Supabase Auth via SSR.
2. Criar a área autenticada e proteger rotas privadas no `src/proxy.ts` (redireccionar sem sessão).
3. Validar lint, build, sessão autenticada e acesso bloqueado a rotas privadas.
4. Só então configurar a Vercel (preview e produção) e concluir o Sprint 1.

## Procedimento para entregar ao Claude Code

1. Guarde todas as alterações desta pasta num repositório Git ou copie a pasta completa, incluindo `docs/`, `package.json`, `package-lock.json` e `CLAUDE.md`. Não é necessário copiar `node_modules/` nem `.next/`.
2. Antes da passagem, reveja e crie um commit de base:

   ```bash
   git status
   git add .
   git commit -m "chore: initialize Despact foundation"
   ```

   Reveja o resultado de `git status` antes do `git add .` para confirmar que não há ficheiros pessoais inesperados.

3. No computador/terminal onde usa Claude Code, abra a raiz do projecto e instale dependências:

   ```bash
   cd caminho/para/despact-
   npm ci
   npm run lint
   npm run build
   ```

4. Inicie o Claude Code nessa mesma raiz. O ficheiro `CLAUDE.md` será carregado como orientação do projecto.

5. Envie esta mensagem inicial ao Claude Code:

   ```text
   Lê CLAUDE.md e todos os documentos indicados antes de alterar código. Continua apenas o Sprint 1 a partir do próximo passo autorizado em docs/HANDOFF_CLAUDE_CODE.md. Comunica em português de Portugal, explica e justifica cada decisão antes de implementar, preserva o âmbito e não exponhas segredos. No fim de cada passo, executa lint e build quando aplicável e actualiza a documentação relevante.
   ```

6. Só depois de o Claude explicar a integração Supabase, crie no painel Supabase um projecto de desenvolvimento. Guarde URL e chave publicável apenas no `.env.local`; nunca as cole no chat, em Git ou em documentação.

7. Peça ao Claude para trabalhar em passos pequenos e fazer um commit após cada unidade coerente: ambiente/Supabase, autenticação, deploy. Antes de cada commit, execute `npm run lint` e `npm run build`.

## Atenções operacionais

- Em PowerShell, se `npm` falhar por causa de `npm.ps1`, usar `npm.cmd` em vez de alterar a política de execução.
- O npm reportou duas vulnerabilidades moderadas transitivas na criação do projecto. Não foi aplicado `npm audit fix --force`; avaliar actualizações com cuidado e registar a decisão antes de alterar versões.
- A pasta `.idea/`, `node_modules/`, `.next/` e ficheiros de ambiente locais são ignorados por Git.
- Há alterações ainda não registadas no Git no momento desta passagem. O passo de commit acima cria a linha de base recomendada.
