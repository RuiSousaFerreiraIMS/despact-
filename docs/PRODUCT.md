# Produto — Despact

## Propósito

O Despact é uma plataforma pessoal de finanças orientada a decisões. Deve dar ao utilizador clareza sobre a sua situação financeira e ajudá-lo a decidir o que fazer a seguir; o registo de despesas é um meio para esse fim, não o produto em si.

## Utilizador e propriedade dos dados

O MVP será usado inicialmente pelo proprietário do projecto. Ainda assim, cada dado financeiro pertence a um utilizador autenticado e nenhum requisito, modelo ou fluxo pode assumir um único utilizador.

Não há contas partilhadas, famílias ou colaboração no MVP.

## Resultado esperado no MVP

Depois de registar as suas contas e transacções, o utilizador consegue, em poucos segundos:

- perceber o valor líquido do seu património;
- ver a posição consolidada das suas contas;
- acompanhar o progresso dos seus objectivos;
- compreender tendências simples de receitas, despesas e poupança;
- receber indicações básicas e explicáveis sobre a sua situação.

## Funcionalidades incluídas

| Área | Capacidades do MVP |
| --- | --- |
| Autenticação | Criar sessão, terminar sessão e proteger dados por utilizador. |
| Contas | Criar, consultar, editar e arquivar contas financeiras. |
| Transacções | Criar, consultar, editar e eliminar transacções manuais. |
| Categorias | Gerir categorias usadas para classificar transacções. |
| Objectivos | Criar e acompanhar objectivos financeiros. |
| Património líquido | Apresentar o valor consolidado de activos e passivos. |
| Painel | Apresentar um resumo claro da saúde financeira. |
| Insights básicos | Apresentar observações determinísticas, curtas e explicáveis. |
| Experiência | Funcionar bem em ecrãs móveis e de secretária. |

## Fluxos essenciais

### Primeira utilização

1. O utilizador autentica-se.
2. Cria pelo menos uma conta.
3. Define o saldo inicial da conta e, quando necessário, regista uma transacção.
4. Vê o património líquido e um painel com informação útil, mesmo que ainda limitada.

### Registar uma transacção

O utilizador escolhe uma conta, tipo, montante, data e categoria quando aplicável; pode acrescentar uma descrição opcional. O fluxo deve poder ser concluído em menos de 15 segundos em condições normais.

### Rever a situação financeira

O painel apresenta primeiro os indicadores que respondem a "Como estou?". Detalhes históricos e gráficos nunca devem impedir a leitura rápida da situação actual.

## Limites explícitos do MVP

Não fazem parte do MVP: Open Banking, importação de CSV/PDF, OCR, análise de e-mail, classificação por IA, chat, recomendações de investimento, automação de orçamentos, notificações, contas partilhadas ou modo de família.

O modelo pode reservar fronteiras para futuras integrações, mas não deve criar interfaces, fluxos ou complexidade de produto para essas funcionalidades nesta fase.

## Critérios transversais de aceitação

- Todo o dado financeiro é isolado por utilizador autenticado.
- O utilizador não consegue aceder ou alterar dados de outro utilizador.
- Montantes e cálculos financeiros são apresentados de forma consistente e precisa.
- As conclusões apresentadas como insights indicam claramente os dados ou regra que as originam.
- As acções principais são utilizáveis em telemóvel e em computador.
