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

## Sprint 1 — autenticação: estado

1. ~~Registo, início e fim de sessão com Supabase Auth via SSR~~ — implementados (`/login`, `/signup`, Server Actions, `/auth/confirm`).
2. ~~Área autenticada e protecção de rotas privadas~~ — a raiz `/` é a página autenticada mínima; o proxy redirecciona sem sessão para `/login` (verificado: `GET /` sem sessão responde 307 → `/login`).
3. Lint e build passam.

### Configuração de e-mail — decisão de desenvolvimento

- O Supabase exige SMTP próprio para enviar e-mails de autenticação; por isso, no projecto de **desenvolvimento** a opção "Confirm email" foi desactivada (Authentication → Sign In / Providers → Email). O registo cria sessão imediata; o código em `src/app/(auth)/actions.ts` suporta ambos os modos.
- **Obrigatório antes de produção:** configurar um fornecedor SMTP (por exemplo Resend), reactivar "Confirm email" e actualizar o template "Confirm signup" para
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
  (o route handler `/auth/confirm` já está implementado e pronto).
- Confirmar que o Site URL (Authentication → URL Configuration) é `http://localhost:3000` durante o desenvolvimento.
- Testar o ciclo completo: registo → sessão imediata → linha criada em `profiles` → logout → rota privada barrada.

## Sprint 1 — CONCLUÍDO

1. ~~Vercel configurada~~ — produção em `https://despact.vercel.app` a partir de `main`; previews automáticos por branch. Variáveis de ambiente no painel Vercel: produção → projecto Supabase de produção; previews → projecto de desenvolvimento.
2. ~~Projecto Supabase de produção criado~~ — migração `profiles` aplicada pela mesma ordem via CLI; Site URL configurado para o domínio de produção.
3. ~~Critérios de saída validados~~ — sessão e logout funcionam em dev e produção; rota privada sem sessão responde 307 → `/login`; builds locais e na Vercel passam; nenhum segredo no repositório ou browser além das chaves publicáveis.

Regra operacional dos ambientes: a máquina local (`.env.local` e o `link` da CLI) aponta **sempre** ao projecto de desenvolvimento; os valores de produção existem apenas no painel da Vercel.

Pendência antes de haver utilizadores reais além do proprietário: SMTP (por exemplo Resend), reactivar "Confirm email" e actualizar o template conforme a secção de e-mail acima.

## Sprint 2 — CONCLUÍDO

1. ~~Migração financeira~~ — `20260715140000_financial_core.sql`, aplicada a dev e produção.
2. ~~Funcionalidade de contas~~ — `/accounts` (listar com saldo derivado, criar, editar, arquivar/reactivar), módulo `src/features/accounts/`, utilitário `src/lib/money/`, view `account_balances`, tipos gerados do esquema.
3. ~~Funcionalidade de categorias~~ — `/categories` com criação inline, renomear, arquivar/reactivar; tipo fixo após criação.
4. ~~Funcionalidade de transacções~~ — `/transactions` (histórico), `/transactions/new`, `/transactions/[id]/edit`, `/transactions/transfer`; sinal derivado do tipo no servidor; transferências pelas funções atómicas.
5. ~~Produção~~ — as 3 migrações aplicadas pela mesma ordem em dev e produção; merge em `main` e deploy Vercel verificados.

### Critérios de saída do Sprint 2 (ROADMAP.md)

- Contas, categorias e transacções respeitam `DATABASE.md` — verificado por teste E2E na base de dados (20/20), incluindo integridade entre linhas e chaves compostas.
- Saldos e transferências calculados correctamente — verificado ao cêntimo pelo E2E (saldos derivados; pares simétricos).
- RLS impede acesso entre utilizadores — verificado pelo E2E com dois utilizadores.
- Fluxo de adicionar transacção em <15 segundos — testado e aprovado pelo proprietário.

### Feedback do proprietário para o polimento (Sprint 3/4)

- Em desktop o layout fica demasiado "esticado"/vazio; melhorar o uso do espaço em ecrãs largos.
- Visual e interacção têm margem de melhoria; a base shadcn/ui e uma passagem de design entram com o painel (Sprint 3) e o polimento (Sprint 4).

## Sprint 3 — CONCLUÍDO

1. ~~Migração de `goals`~~ — `20260715160000_goals.sql`, aplicada ao dev; verificada por E2E (8/8).
2. ~~Funcionalidade de objectivos~~ — `/goals`, `/goals/new`, `/goals/[id]/edit`; progresso manual inline; estados concluído/arquivado.
3. ~~Património líquido~~ — no painel, pela convenção D-002 (contas arquivadas continuam a contar, conforme `DATABASE.md`).
4. ~~Painel~~ — página inicial com património, resumo do mês (sem transferências), contas e objectivos; layout alargado em desktop (feedback tratado em parte). A base shadcn/ui ficou para o polimento do Sprint 4, por decisão de gestão de risco (instalação interactiva e diff grande).
5. ~~Produção~~ — migração `goals` aplicada (4/4 sincronizadas); merge em `main` e deploy verificados.

### Critérios de saída do Sprint 3 (ROADMAP.md)

- O património líquido resulta da convenção do Sprint 0 (D-002) — soma dos saldos derivados, dívidas negativas.
- O painel prioriza indicadores de decisão antes de detalhe histórico — património → mês corrente → contas → objectivos.
- Objectivos apresentam progresso e data-alvo quando definida — barra de progresso e data no cartão.

Lembrete operacional: depois de qualquer operação com produção, voltar a apontar a CLI ao projecto de desenvolvimento (`npx supabase link --project-ref <ref-dev>`).

## Próximo passo autorizado — Sprint 4: insights e polimento

O polimento visual é o tema central deste sprint, respondendo ao feedback do proprietário (interface utilitária, pouco apelativa). Unidades previstas:

1. ~~Base shadcn/ui e passagem de design~~ — identidade Despact (tinta/papel/verde-nota, Space Grotesk + Instrument Sans) aplicada a todas as páginas; sidebar desktop e barra inferior mobile com acção central; direcção aprovada pelo proprietário.
2. ~~Insights (D-007)~~ — quatro regras puras e testadas no painel: taxa de poupança, despesas vs. mês anterior (período comparável), maior categoria, cobertura do património. Cada uma expõe a regra e o período.
3. ~~Categorias sugeridas (D-008)~~ — semeadas no registo e a pedido; migração `20260715170000_default_categories.sql` aplicada ao dev.
4. ~~Revisão final~~ — loading skeleton, error boundary recuperável e 404 na área autenticada; skip link e semântica ARIA; cabeçalhos de segurança no `next.config.ts`; sem segredos nem `service_role` no código.
5. ~~Produção~~ — migração das categorias sugeridas aplicada (5/5 sincronizadas); merge em `main`, deploy Vercel e verificação em produção (cabeçalhos, identidade, protecção de rotas).

Qualidade: existe agora `npm test` (vitest) com 18 testes unitários de dinheiro e regras de insights; correr junto com lint e build.

### Critérios de saída do Sprint 4 (ROADMAP.md)

- Insights são determinísticos e explicáveis — quatro regras puras, cada uma com a regra e o período visíveis; sem tabela persistida, sem IA.
- Fluxos principais revistos em mobile e desktop — identidade aplicada aos dois formatos, com navegação própria de cada um.
- Estados vazios, erros e carregamentos tratados — skeletons, error boundary, 404, mensagens de formulário e estados vazios com acção.
- Revisão final de acessibilidade, desempenho e segurança feita e registada no CHANGELOG.

## MVP CONCLUÍDO — estado em 16 de Julho de 2026

Todo o âmbito bloqueado do MVP está entregue e em produção (`https://despact.vercel.app`): autenticação, painel, contas, transacções (com transferências atómicas), categorias (com sugeridas), objectivos, património líquido, insights básicos e design responsivo com identidade própria.

### Pendências operacionais conhecidas

- SMTP + reactivar "Confirm email" (e template `token_hash`) antes de abrir a utilizadores reais além do proprietário.
- A máquina local (`.env.local` e `supabase link`) deve apontar sempre ao projecto de desenvolvimento.
- Utilizadores de teste `e2e-*@despact.test` na base de dados de desenvolvimento podem ser apagados no painel.

### Próximos passos possíveis (fora do MVP; exigem decisão explícita)

Consultar `PROJECT_CONTEXT.md` — funcionalidades como Open Banking, importações, orçamentos ou notificações pertencem a versões futuras e não devem ser iniciadas sem novo mandato.

## Feedback de testadores (16 de Julho de 2026) e resposta

Proprietário e amigos testaram, sobretudo em mobile. Tratado nesta iteração:

- Menu de perfil (bola com inicial) no canto superior direito do mobile: nome/e-mail, acesso a Categorias e terminar sessão.
- PWA: manifest, ícones e modo standalone — "Adicionar ao ecrã inicial" abre a app sem interface de browser.
- Objectivos com data-alvo mostram quanto falta e o valor mensal necessário (`goalPace`, função pura testada).
- Criar categoria directamente no formulário de movimento ("+ Nova categoria…"), com reutilização de categorias homónimas activas.

**Candidato prioritário a V2 (não iniciado — exige decisão):** automatização do registo e classificação de despesas/receitas. Caminhos possíveis por ordem de esforço: regras de categorização por descrição → importação CSV → Open Banking. Pedido por dois testadores; é a maior alavanca de retenção identificada.

## V2 Sprint 5 — Open Banking: estado

1. ~~Migração `bank_sync`~~ — proveniência (`source`, `external_id` único), `bank_connections`, `bank_account_links`; aplicada ao dev.
2. ~~Cliente Enable Banking~~ — JWT RS256 no servidor; credenciais validadas contra a API real (sandbox).
3. ~~Fluxo completo implementado~~ — ligar banco, consentimento, callback, mapeamento com importação e ajuste de saldo, sincronização manual idempotente, revogação.
4. ~~Teste manual do consentimento~~ — feito pelo proprietário no sandbox (Mock ASPSP): consentimento, mapeamento, importação e sincronização confirmados.
5. ~~Migração em produção e deploy~~ — 6/6 migrações sincronizadas; merge em `main` e rotas verificadas em produção.

### Pendente para activar bancos reais em produção (proprietário)

- Concluir a aplicação **Production** no Enable Banking (Privacy/Terms URLs vazios no modo restrito; se forem exigidos, criar `/privacy` e `/terms` no Despact primeiro).
- Na Vercel (âmbito Production): `ENABLE_BANKING_APP_ID` e `ENABLE_BANKING_PRIVATE_KEY_BASE64` da aplicação Production; fazer Redeploy.
- No Control Panel do Enable Banking: whitelist das contas próprias (modo restrito).
- Testar em `despact.vercel.app`: Bancos → banco real → consentimento → importação.

Nota operacional: em sandbox só aparecem bancos fictícios; os bancos reais exigem a aplicação Production. Terceiros só com contrato comercial + KYB (D-009); até lá usam o CSV do Sprint 6.

## Orientação para objectivos (pedido do proprietário, 16 de Julho de 2026)

O proprietário quer que a app o ajude a saber *como* atingir os objectivos. Primeiro passo entregue de forma determinística (D-007): cada objectivo com data-alvo mostra o valor mensal necessário (`goalPace`), e o painel compara a soma desses ritmos com a poupança média real (insight "Ritmo dos objectivos").

**Fica para V2 (exige decisão):** alocação da poupança por objectivo com prioridades, simulações de cenários ("e se adiar 6 meses?"), contribuições registadas por objectivo. Qualquer um destes altera o modelo de dados (D-006) e merece ADR próprio.

## V2 EM CURSO — Sprint 5: Open Banking (decidido em 17 de Julho de 2026)

O proprietário decidiu: V2 começa pelo Open Banking (D-009); investimentos serão tracking-only em V3, nunca recomendações (D-010). Âmbito V2 registado em `PROJECT_CONTEXT.md` e critérios em `ROADMAP.md`. Ideias registadas para o Sprint 7 (lançamento): tutorial de instalação PWA (iPhone/Android), secção About.

### Estado do Sprint 5

1. ~~Documentação~~ — D-009, D-010, âmbito V2 e critérios de saída escritos.
2. ~~Migração `bank_sync`~~ — escrita (`20260717100000_bank_sync.sql`): proveniência (`source`, `external_id` único por utilizador), `bank_connections`, `bank_account_links`, RLS. **Ainda não aplicada** — a CLI está apontada à produção; reapontar ao dev antes.
3. ~~Cliente GoCardless~~ — `src/lib/gocardless/client.ts` (exclusivo de servidor): token com cache, instituições, requisições, contas/saldos, movimentos booked normalizados; conversão decimal→unidades mínimas testada.
4. Fluxo de ligação e sincronização (UI + acções + callback) — segue-se, depois da migração aplicada e dos segredos configurados.

### Acções manuais pendentes (proprietário)

- Reapontar a CLI ao dev: `npx supabase link --project-ref <ref-dev>`.
- Criar conta gratuita em `bankaccountdata.gocardless.com`, gerar *user secrets* (secret_id + secret_key) e colocá-los no `.env.local` como `GOCARDLESS_SECRET_ID` e `GOCARDLESS_SECRET_KEY`. Nunca no chat, Git ou browser.
- O teste E2E usará a instituição sandbox do fornecedor (`SANDBOXFINANCE_SFIN0000`) antes de qualquer banco real.

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
