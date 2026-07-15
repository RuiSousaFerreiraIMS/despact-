# Decisões de Arquitectura e Domínio

Este documento regista decisões tomadas no Sprint 0. O contexto do projecto continua a ser a fonte de verdade para visão e âmbito; este documento explica como os requisitos serão concretizados.

## D-001 — Representação de dinheiro

**Decisão:** todos os montantes persistidos são inteiros em unidades monetárias mínimas (por exemplo, cêntimos) e têm um código de moeda ISO 4217. O EUR é a moeda de apresentação inicial do produto.

**Justificação:** números de ponto flutuante introduzem erros de arredondamento em operações financeiras. Guardar a moeda desde o início permite evoluir sem migração estrutural, sem obrigar o MVP a conversões cambiais.

**Consequência no MVP:** não há conversão entre moedas nem agregação de património multi-moeda. A experiência inicial assume EUR.

## D-002 — Convenção de saldo

**Decisão:** o saldo actual de uma conta é `saldo inicial + soma dos movimentos`. Um activo tem tipicamente saldo positivo; uma dívida, incluindo cartão de crédito, tem saldo negativo. O património líquido é a soma dos saldos de todas as contas incluídas no património.

**Justificação:** uma única convenção assinada torna o cálculo transparente. Um cartão com 250 EUR em dívida contribui com -250 EUR, sem regras especiais no cálculo do património.

**Consequência no MVP:** o saldo inicial é um valor assinado explícito. A interface deve explicar o sinal quando for relevante, para não criar ambiguidade ao configurar contas de dívida.

## D-003 — Movimentos e tipos de transacção

**Decisão:** cada movimento tem um montante assinado que altera o saldo da sua conta. Receitas são positivas, despesas são negativas e transferências são pares de movimentos ligados: um negativo na conta de origem e um positivo na conta de destino.

**Justificação:** este modelo mantém o histórico e os saldos correctos sem duplicar montantes no património. A ligação entre os dois lados de uma transferência torna possível editar ou eliminar a operação de forma coerente.

**Consequência no MVP:** uma transferência não é receita nem despesa e não usa categoria. A criação de transferências pode ter uma interface própria mais tarde no Sprint 2, mas o modelo de dados tem de a suportar desde o início.

## D-004 — Contas

**Decisão:** o MVP começa com contas de tipo `cash`, `current`, `savings`, `credit_card` e `loan`. Cada conta pertence a um só utilizador, tem nome, moeda, saldo inicial e estado activo/arquivado.

**Justificação:** estes tipos cobrem o uso pessoal corrente e permitem uma apresentação compreensível. Arquivar preserva histórico e evita apagar dados financeiros.

**Consequência no MVP:** investimentos, contas partilhadas e sincronização bancária não são suportados. Todos os tipos acima podem contribuir para o património segundo a convenção D-002.

## D-005 — Categorias

**Decisão:** categorias são criadas por utilizador, têm um nome e um tipo (`income` ou `expense`) e não são hierárquicas no MVP.

**Justificação:** a classificação deve tornar o registo rápido. Hierarquias, regras automáticas e categorias globais acrescentariam complexidade sem benefício essencial inicial.

**Consequência no MVP:** uma categoria só pode ser usada em transacções compatíveis com o seu tipo. Categorias em uso são arquivadas, não eliminadas.

## D-006 — Objectivos

**Decisão:** um objectivo tem nome, montante-alvo, data-alvo opcional e progresso manual. O progresso é um montante positivo, actualizado explicitamente pelo utilizador.

**Justificação:** vincular automaticamente objectivos a contas exige regras sobre saldos reservados, transferências e sobreposição entre objectivos. O progresso manual entrega valor no MVP e preserva uma evolução futura clara.

**Consequência no MVP:** um objectivo não reserva dinheiro numa conta nem altera o património. Pode, no futuro, ganhar regras de financiamento sem quebrar os dados existentes.

## D-007 — Insights básicos

**Decisão:** os insights do MVP são regras determinísticas calculadas a partir de dados existentes, com explicação curta da regra e período usado.

**Justificação:** o utilizador deve confiar e conseguir compreender cada indicação. Isto cumpre a filosofia orientada à decisão sem introduzir IA ou recomendações financeiras.

**Consequência no MVP:** não há previsões, aconselhamento de investimento ou classificação por IA.

## Questões adiadas de propósito

- Estratégia de conversão cambial e património em várias moedas.
- Reconciliação, estados pendentes e datas de liquidação bancária.
- Importação, deduplicação e proveniência de dados externos.
- Orçamentos, regras de categorização e alertas.
- Ligação automática entre objectivos e contas.
