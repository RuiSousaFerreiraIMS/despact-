# Passagem para Claude Code

## Objectivo desta passagem

Permitir que o Claude Code continue o Despact sem voltar a decidir requisitos já fechados, sem ampliar o âmbito e sem expor credenciais.

## Estado exacto em 15 de Julho de 2026

### Concluído

- Sprint 0: contexto, produto, decisões de domínio, arquitectura, desenho de dados, roadmap e changelog.
- Início do Sprint 1: aplicação Next.js mínima criada na raiz.
- Validações executadas com sucesso após a criação:
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
| Supabase/Auth | Ainda não configurados. |
| Base de dados/migrações | Ainda não existem. |
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

## Próximo passo autorizado — Sprint 1: ambientes e Supabase

Antes de implementar autenticação, o Claude Code deve explicar e acordar estas decisões:

1. Criar um projecto Supabase de desenvolvimento e definir o processo para preview/produção.
2. Instalar apenas `@supabase/supabase-js` e `@supabase/ssr` nas versões compatíveis actuais.
3. Adicionar `.env.example` sem valores reais, com:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Criar clientes Supabase separados para browser e servidor sob `src/lib/supabase/`.
5. Criar a primeira migração apenas para a base de identidade/perfil, RLS e políticas de `profiles`; não criar tabelas financeiras ainda.
6. Configurar a renovação de sessão conforme a documentação SSR actual do Supabase.

Depois destes pontos, validar lint, build, sessão autenticada e acesso bloqueado a rotas privadas. Só então configurar Vercel e concluir o Sprint 1.

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
