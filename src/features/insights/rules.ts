import { formatMinorUnits } from "@/lib/money/format";

/**
 * Regras de insights do MVP (D-007): determinísticas, calculadas sobre dados
 * existentes e sempre acompanhadas da regra e do período que as originam.
 * Funções puras — sem datas implícitas nem acesso a dados — para serem
 * testáveis unitariamente.
 */

export interface Insight {
  id: string;
  title: string;
  body: string;
  /** A regra e o período, apresentados ao utilizador (D-007). */
  explanation: string;
  tone: "positive" | "neutral" | "warning";
}

/** Taxa de poupança do mês: (receitas − despesas) ÷ receitas. */
export function savingsRateInsight(input: {
  incomeMinor: number;
  expenseMinor: number;
  monthLabel: string;
}): Insight | null {
  if (input.incomeMinor <= 0) {
    return null;
  }

  const netMinor = input.incomeMinor + input.expenseMinor;
  const rate = Math.round((netMinor / input.incomeMinor) * 100);
  const explanation = `Regra: (receitas − despesas) ÷ receitas, em ${input.monthLabel}.`;

  if (netMinor < 0) {
    return {
      id: "savings-rate",
      title: "Poupança do mês",
      body: `As despesas superaram as receitas em ${formatMinorUnits(-netMinor, "EUR")} este mês.`,
      explanation,
      tone: "warning",
    };
  }

  return {
    id: "savings-rate",
    title: "Poupança do mês",
    body: `Este mês poupou ${rate}% das receitas (${formatMinorUnits(netMinor, "EUR")}).`,
    explanation,
    tone: rate >= 20 ? "positive" : "neutral",
  };
}

/** Despesas do mês comparadas com o mesmo período do mês anterior. */
export function expenseComparisonInsight(input: {
  /** Soma (negativa) das despesas de 1 até `day` do mês corrente. */
  currentExpenseMinor: number;
  /** Soma (negativa) das despesas de 1 até `day` do mês anterior. */
  previousExpenseMinor: number;
  day: number;
  monthLabel: string;
  previousMonthLabel: string;
}): Insight | null {
  const current = Math.abs(input.currentExpenseMinor);
  const previous = Math.abs(input.previousExpenseMinor);

  if (previous === 0) {
    return null;
  }

  const diffPercent = Math.round(((current - previous) / previous) * 100);
  const explanation = `Regra: despesas de 1 a ${input.day} de ${input.monthLabel}, comparadas com 1 a ${input.day} de ${input.previousMonthLabel}.`;

  if (Math.abs(diffPercent) < 5) {
    return {
      id: "expense-comparison",
      title: "Despesas vs. mês anterior",
      body: `As despesas estão em linha com ${input.previousMonthLabel} no mesmo período.`,
      explanation,
      tone: "neutral",
    };
  }

  return {
    id: "expense-comparison",
    title: "Despesas vs. mês anterior",
    body: `Até dia ${input.day}, gastou ${Math.abs(diffPercent)}% ${
      diffPercent > 0 ? "mais" : "menos"
    } do que em ${input.previousMonthLabel} no mesmo período.`,
    explanation,
    tone:
      diffPercent >= 20 ? "warning" : diffPercent <= -10 ? "positive" : "neutral",
  };
}

/** Maior categoria de despesa do mês e o seu peso no total. */
export function topCategoryInsight(input: {
  /** Totais positivos por categoria; "Sem categoria" incluída se existir. */
  categories: { name: string; spentMinor: number }[];
  monthLabel: string;
}): Insight | null {
  const total = input.categories.reduce(
    (sum, category) => sum + category.spentMinor,
    0,
  );

  if (total <= 0) {
    return null;
  }

  const top = input.categories.reduce((best, category) =>
    category.spentMinor > best.spentMinor ? category : best,
  );
  const share = Math.round((top.spentMinor / total) * 100);

  return {
    id: "top-category",
    title: "Maior despesa por categoria",
    body: `${top.name} é a sua maior despesa de ${input.monthLabel}: ${formatMinorUnits(top.spentMinor, "EUR")} (${share}% do total).`,
    explanation: `Regra: soma das despesas por categoria em ${input.monthLabel}.`,
    tone: "neutral",
  };
}

/** Quantos meses de despesas médias o património actual cobre. */
export function coverageInsight(input: {
  netWorthMinor: number;
  /** Média mensal (positiva) das despesas dos meses completos analisados. */
  averageMonthlyExpenseMinor: number;
  windowLabel: string;
}): Insight | null {
  if (input.averageMonthlyExpenseMinor <= 0 || input.netWorthMinor <= 0) {
    return null;
  }

  const months =
    Math.floor(
      (input.netWorthMinor / input.averageMonthlyExpenseMinor) * 10,
    ) / 10;
  const monthsLabel = months.toFixed(1).replace(".", ",");

  return {
    id: "coverage",
    title: "Cobertura do património",
    body: `O seu património cobre aproximadamente ${monthsLabel} meses de despesas.`,
    explanation: `Regra: património líquido ÷ média mensal de despesas (${input.windowLabel}).`,
    tone: months >= 6 ? "positive" : months < 2 ? "warning" : "neutral",
  };
}
