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
- View `account_balances` com `security_invoker`: saldo derivado calculado na base de dados, nunca persistido.
- Tipos TypeScript gerados do esquema Supabase (`src/types/database.ts`) e aplicados aos clientes.

### Sprint 2 — contas

- Funcionalidade de contas em `src/features/accounts/` (consultas, acções de servidor e validação fora da interface).
- Páginas `/accounts`, `/accounts/new` e `/accounts/[id]/edit`: listar com saldo, criar, editar, arquivar e reactivar; contas nunca são eliminadas.
- Utilitário `src/lib/money/` para formatação pt-PT e conversão texto↔unidades mínimas sem vírgula flutuante.
- Layout autenticado mobile-first com navegação e terminar sessão no cabeçalho.
- A moeda de uma conta é fixa após a criação (coerência com transacções futuras).

### Sprint 2 — categorias

- Funcionalidade de categorias em `src/features/categories/`: criação inline em `/categories`, listas separadas por receita/despesa, renomear, arquivar e reactivar.
- O tipo de uma categoria é fixo após a criação (coerência com transacções já classificadas).

### Sprint 2 — transacções

- Funcionalidade de transacções em `src/features/transactions/`: registar receita/despesa, editar, eliminar; transferências criadas e eliminadas pelas funções atómicas da base de dados.
- O utilizador introduz sempre montantes positivos; o sinal deriva do tipo no servidor (D-003).
- Formulário de transacção como componente cliente (único até agora) para filtrar categorias pelo tipo em tempo real.
- Histórico `/transactions` com os dois lados das transferências identificados; eliminar um lado elimina o par.
- Teste E2E das regras financeiras na base de dados de desenvolvimento: 20/20 verificações (sinais, categoria compatível, moeda, conta arquivada, transferência simétrica, saldos derivados, RLS entre utilizadores).

### Sprint 3 — objectivos, património e painel

- Migração `goals` (D-006): alvo positivo, progresso manual não negativo, estados `active`/`completed`/`archived`, RLS sem política de DELETE.
- Funcionalidade de objectivos em `src/features/goals/`: criar, editar, actualizar progresso inline, concluir, arquivar e reactivar; barra de progresso acessível.
- Painel na página inicial: património líquido (D-002, soma dos saldos derivados; dívidas negativas), resumo do mês (receitas/despesas/poupança, transferências excluídas), contas e objectivos activos.
- Layout alargado (`max-w-5xl`) e grelha de 2 colunas em desktop, em resposta ao feedback do proprietário.
- Teste E2E de `goals` na base de dados de desenvolvimento: 8/8 verificações.
- Migração `goals` aplicada a produção (4/4 sincronizadas); merge e deploy verificados. Sprint 3 concluído.

### Sprint 4 — identidade visual (primeira passagem)

- Base shadcn/ui instalada (preset radix/nova) com tokens próprios do Despact: tinta azul-negra, papel quente, verde-nota como cor de assinatura, token `success` para valores positivos.
- Tipografia: Space Grotesk (display, números tabulares) e Instrument Sans (corpo), via `next/font`.
- Shell de navegação novo: sidebar escura fixa no desktop; no mobile, cabeçalho compacto e barra de separadores inferior com acção central destacada para novo movimento.
- Painel redesenhado: património líquido como elemento principal, cartões de resumo do mês com ícones, listas de contas e objectivos em cartões.
- Verificação visual por inspecção em viewport desktop e mobile; cálculos do painel confirmados com dados de demonstração.
- Identidade aplicada a todas as páginas: autenticação, contas, categorias, movimentos, transferências e objectivos — cartões, botões, inputs, selects nativos estilizados, badges e alertas de formulário consistentes.
- Componentes partilhados novos: `NativeSelect` (selects de servidor com estilo do tema) e `FormAlert` (mensagens de erro/sucesso).

### Sprint 4 — categorias sugeridas e insights

- Categorias sugeridas (D-008): função `seed_default_categories` (8 despesa + 2 receita), chamada no registo pelo trigger e disponível na página de categorias para contas sem categorias; idempotente. Verificado por E2E.
- Insights (D-007) no painel, como funções puras testáveis: taxa de poupança do mês, despesas vs. mês anterior em período comparável, maior categoria de despesa e cobertura do património em meses de despesas médias. Cada um mostra a regra e o período.
- Testes unitários (vitest): 18 testes para conversão/formatação de dinheiro e regras de insights.
- Verificação E2E no painel em execução: os quatro insights renderizam com cálculos correctos.

### Sprint 4 — revisão final

- Estados de carregamento (skeleton), erro recuperável ("Tentar novamente") e 404 com marca na área autenticada.
- Acessibilidade: atalho "Saltar para o conteúdo", `aria-current` na navegação, `role=progressbar` nos objectivos, alertas com `role=alert`, foco visível nos tokens.
- Segurança: cabeçalhos `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`; reconfirmado que não há segredos versionados nem uso de `service_role`.
- Desempenho: fontes self-hosted via `next/font`; apenas dois componentes cliente (formulário de movimento e navegação).
- Verificado em execução: cabeçalhos, skip link e 404 autenticado.

### Pós-Sprint 6 — reconciliação automática ao abrir

- A sincronização ao abrir a app passou a **reconciliar o saldo automaticamente** (além de importar movimentos), sem clique manual. Helper `reconcileAccountBalance` partilhado entre o auto-sync e a acção manual.
- Intervalo de arrefecimento do auto-sync ajustado de 6h para 3h — mais fresco, respeitando o limite PSD2 de ~4 acessos automáticos por dia.
- Registado o limite inerente: movimentos pendentes no banco só aparecem quando este os liquida (1-3 dias úteis); nenhuma cadência de sincronização o contorna.

### Pós-Sprint 6 — correcção de saldo bancário e estados de espera

- Correcção: a escolha do saldo de referência do banco passou a ser determinística e a preferir o saldo contabilístico (booked), evitando o saldo "esperado" que inclui movimentos pendentes e desalinhava o saldo inicial. Documentado: o Despact reflecte movimentos liquidados; compras pendentes só entram quando o banco as fecha.
- Nova acção "Reconciliar saldo" por conta ligada: importa o que houver e realinha o saldo inicial com o saldo booked do banco, corrigindo desvios sem re-ligar.
- Estados de espera (`SubmitButton` com `useFormStatus`): spinner e etiqueta de progresso em sincronizar, reconciliar, ligar contas/banco e criar conta; o seletor de bancos mostra "A abrir o banco…" ao iniciar o consentimento.

### V2 Sprint 6 (Unidade B) — importação CSV

- Ferramentas puras de CSV (`src/features/import/csv.ts`): deteção de separador, parsing com aspas, montantes europeus/americanos (sinais, parênteses, moeda), datas DD/MM e ISO, normalização com coluna única assinada ou débito/crédito separados; 14 testes unitários.
- Migração: valor `csv` no enum `transaction_source` (proveniência).
- Assistente `/transactions/import`: escolher conta, carregar CSV, mapear colunas (auto-adivinha pelo cabeçalho), pré-visualizar movimentos válidos e ignorados, e importar.
- A acção de servidor revalida cada linha, categoriza pelas regras (D-011) e insere com `source=csv`; sem deduplicação automática (aviso na pré-visualização).
- Disponível para qualquer utilizador — é o caminho de quem não pode ligar o banco directamente (modo restrito).
- Verificado por E2E na BD (7/7): inserção com `source=csv`, categorização no import, tipos e saldo derivado correctos.

### V2 Sprint 6 (Unidade A) — categorização automática por regras

- Migração `categorization_rules` (D-011): padrão, tipo de correspondência, categoria, prioridade; RLS e chave composta com `categories`.
- Motor `categorize` em TypeScript puro (`src/features/categorization/rules.ts`): determinístico, sem acentos/maiúsculas, respeita prioridade e tipo; 6 testes unitários (33 no total).
- Página **Categorias → Regras** (`/categories/rules`): criar regras (contém/começa por/é igual a → categoria), apagar, e "Aplicar às não categorizadas".
- Movimentos importados do banco passam a chegar já categorizados quando uma regra corresponde (sync bancário liga-se ao motor).
- Verificado por E2E na BD (6/6): RLS das regras, aplicação correcta, tipo respeitado, movimentos sem correspondência ficam intactos.

### V2 Sprint 5 — melhorias (feedback do proprietário)

- Sincronização automática ao abrir a app (`syncStaleBankLinks` + componente cliente `BankAutoSync` no layout): actualiza as contas ligadas cuja última sincronização tem mais de 6 horas, com a sessão do próprio utilizador (sem `service_role`). Não bloqueia a página; actualiza a interface se importar algo. Verificada no browser (acção invocada com sucesso ao carregar).
- Pesquisa de bancos em `/banks/connect` (componente cliente `BankPicker`): filtro por nome, sem distinguir acentos nem maiúsculas, com contador e estado vazio; lista com scroll próprio. Verificado no browser.
- Nota de uso registada: em modo restrito só as contas incluídas na activação ("link accounts") do Enable Banking ficam acessíveis; ligar mais contas exige repetir a activação e autorizá-las.

### V2 Sprint 5 — Open Banking (Enable Banking)

- Fornecedor mudado de GoCardless (descontinuado, fechado a novos registos desde Julho de 2025) para Enable Banking; D-009 revisto.
- Cliente `src/lib/enablebanking/` exclusivo de servidor: JWT RS256 assinado com a chave privada da aplicação (node:crypto, sem dependências novas), bancos, autorização, sessões, contas, saldos e movimentos com paginação.
- Fluxo completo: `/banks` (ligações e sincronização), `/banks/connect` (escolha do banco), callback `/api/bank/callback`, `/banks/[id]/link` (mapeamento: cada conta bancária cria uma conta Despact com histórico importado e saldo inicial ajustado ao saldo do banco).
- Importação idempotente por `external_id` único por utilizador; movimentos `source=bank`, sem categoria; moedas divergentes ignoradas de forma determinística.
- Verificado com credenciais reais no sandbox: autenticação JWT, listagem de 815 bancos (Mock ASPSP PT incluído), criação de conexão pendente e URL de consentimento. O passo de consentimento (SPA do fornecedor) requer teste manual em browser.

### Pós-MVP — orientação para objectivos

- Novo insight "Ritmo dos objectivos" (D-007): soma do valor mensal exigido pelos objectivos activos com data-alvo, comparada com a poupança líquida média dos meses anteriores; positivo quando cobre, aviso quando não chega, neutro sem histórico. Regra e período visíveis.
- 4 testes unitários novos (27 no total). Verificado E2E no painel com cenário de poupança insuficiente.
- Pedido do proprietário registado; planos avançados (alocação por objectivo, simulações) ficam para V2.

### Pós-MVP — feedback de testadores (1.ª iteração)

- Menu de perfil no cabeçalho mobile (bola com inicial): nome/e-mail, atalho para Categorias e terminar sessão.
- PWA: manifest público, ícones (normal, maskable e Apple) e modo standalone; marca geométrica de barras ascendentes gerada por script (`scripts/generate-icons.mjs`).
- Objectivos com data-alvo mostram o que falta e o valor mensal necessário (`goalPace`, pura, 5 testes).
- "+ Nova categoria…" no formulário de movimento: cria a categoria no acto do registo; reutiliza categoria activa homónima em vez de falhar.
- Correcção: o manifest era redireccionado para /login pelo proxy; passou a caminho público.
- Feedback sobre automatização de registo/classificação registado no handoff como candidato prioritário a V2 (não iniciado; exige decisão).

### Sprint 4 concluído — MVP fechado

- Migração das categorias sugeridas aplicada a produção (5/5 sincronizadas).
- Merge em `main` e deploy verificados em produção: identidade, cabeçalhos de segurança e protecção de rotas.
- Critérios de saída do Sprint 4 e âmbito completo do MVP validados; pendências operacionais registadas no handoff.

### Sprint 2 concluído

- Migrações financeiras aplicadas a produção pela mesma ordem que em desenvolvimento (3/3 sincronizadas).
- Merge em `main` e deploy de produção verificados; rotas privadas protegidas em produção.
- Critérios de saída do Sprint 2 validados; fluxo de transacção aprovado pelo proprietário.
