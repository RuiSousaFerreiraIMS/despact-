# Roadmap — Despact

O roadmap descreve resultados verificáveis. Cada sprint começa com uma confirmação das decisões relevantes e termina com uma revisão do âmbito; não se antecipam funcionalidades do sprint seguinte.

## Sprint 0 — Fundação

**Objectivo:** tornar o produto implementável sem assumir regras de negócio durante o desenvolvimento.

### Entregáveis

- Contexto de produto, âmbito e fluxos essenciais documentados.
- Decisões de domínio financeiro registadas.
- Arquitectura de aplicação, segurança e estrutura de módulos definidas.
- Modelo de dados, RLS e estratégia de migrações especificados.
- Roadmap e padrões de qualidade acordados.

### Critérios de saída

- É possível explicar como calcular saldo, património, receitas, despesas e transferências.
- Cada dado financeiro tem uma regra de propriedade e isolamento por utilizador.
- O âmbito do MVP e o que fica de fora estão explícitos.
- O Sprint 1 tem entregáveis claros, sem depender de decisões de produto em aberto.
- Não foi criada aplicação, esquema Supabase, dependência ou funcionalidade de produto.

## Sprint 1 — Aplicação, Supabase e autenticação

**Objectivo:** criar uma base executável, segura e passível de deploy, sem implementar as funcionalidades financeiras do Sprint 2.

### Entregáveis previstos

- Aplicação Next.js com TypeScript estrito, App Router, Tailwind e a base shadcn/ui.
- Configuração de ambientes local, preview e produção, sem segredos versionados.
- Projecto Supabase ligado à aplicação e primeira migração de identidade/perfis.
- Integração SSR do Supabase Auth, rotas públicas e área autenticada protegida.
- Vercel configurado para previews e produção.
- Pipeline de qualidade com lint, verificação de tipos e build.

### Critérios de saída

- Um utilizador consegue autenticar-se e terminar sessão.
- Uma rota privada não apresenta conteúdo sem sessão válida.
- Não existem dados financeiros, contas, transacções ou páginas do produto fora do esqueleto de navegação.
- O projecto constrói localmente e em preview de deploy.
- As variáveis de ambiente e segredos não aparecem no repositório nem no browser fora das chaves públicas necessárias.

## Sprint 2 — Contas, transacções e categorias

**Objectivo:** permitir ao utilizador manter registos financeiros manuais correctos e isolados.

### Critérios de saída

- Contas, categorias e transacções respeitam o modelo em `DATABASE.md`.
- Saldos e transferências são calculados correctamente.
- RLS impede acesso entre utilizadores.
- O fluxo de adicionar uma transacção satisfaz o objectivo de menos de 15 segundos.

## Sprint 3 — Painel, objectivos e património

**Objectivo:** transformar dados financeiros em uma visão clara da situação actual.

### Critérios de saída

- O património líquido resulta da convenção definida no Sprint 0.
- O painel prioriza indicadores de decisão antes de detalhe histórico.
- Objectivos apresentam progresso e data-alvo quando definida.

## Sprint 4 — Insights e polimento

**Objectivo:** tornar o produto mais útil e refinado sem expandir o âmbito do MVP.

### Critérios de saída

- Insights são determinísticos e explicáveis.
- Os principais fluxos são revistos em ecrãs móveis e de secretária.
- Estados vazios, erros e carregamentos são tratados.
- É feita uma revisão final de acessibilidade, desempenho e segurança.

## Padrões de qualidade

- TypeScript em modo estrito; não usar `any` para contornar tipos.
- Lint, verificação de tipos e build devem passar antes de integrar alterações.
- Regras de domínio e cálculos financeiros recebem testes unitários quando forem implementados.
- Migrações Supabase são versionadas, revistas e aplicadas pela mesma ordem em todos os ambientes.
- Alterações ao esquema, segurança ou regras financeiras exigem actualização da documentação e uma entrada em `DECISIONS.md` quando envolverem uma escolha duradoura.
- Segredos existem apenas em variáveis de ambiente; ficheiros locais de ambiente são ignorados pelo Git.
- O código é organizado por funcionalidade, com validação no servidor e RLS como defesa obrigatória.
