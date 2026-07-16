import { createClient } from "@/lib/supabase/server";

import {
  coverageInsight,
  expenseComparisonInsight,
  savingsRateInsight,
  topCategoryInsight,
} from "./rules";
import type { Insight } from "./rules";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function isoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthLabel(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

interface TransactionRow {
  kind: "income" | "expense" | "transfer";
  amount_minor: number;
  occurred_on: string;
  category: { name: string } | null;
}

/**
 * Calcula os insights do painel a partir dos movimentos desde o início do
 * terceiro mês anterior e do património actual. Transferências ficam de fora
 * (D-003: são neutras).
 */
export async function getInsights(now = new Date()): Promise<Insight[]> {
  const supabase = await createClient();

  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const day = now.getDate();

  const prevYear = monthIndex === 0 ? year - 1 : year;
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;

  const windowStartIndex = monthIndex - 3;
  const windowYear = windowStartIndex < 0 ? year - 1 : year;
  const windowMonthIndex = ((windowStartIndex % 12) + 12) % 12;

  const [transactionsResult, balancesResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("kind, amount_minor, occurred_on, category:categories(name)")
      .gte("occurred_on", isoDate(windowYear, windowMonthIndex, 1))
      .in("kind", ["income", "expense"]),
    supabase.from("account_balances").select("balance_minor"),
  ]);

  if (transactionsResult.error || balancesResult.error) {
    throw new Error("Não foi possível calcular os insights.");
  }

  const rows = transactionsResult.data as TransactionRow[];
  const monthStart = isoDate(year, monthIndex, 1);

  const currentMonth = rows.filter((row) => row.occurred_on >= monthStart);
  const incomeMinor = currentMonth
    .filter((row) => row.kind === "income")
    .reduce((sum, row) => sum + row.amount_minor, 0);
  const expenseMinor = currentMonth
    .filter((row) => row.kind === "expense")
    .reduce((sum, row) => sum + row.amount_minor, 0);

  // Período comparável do mês anterior: dias 1..day.
  const prevStart = isoDate(prevYear, prevMonthIndex, 1);
  const prevComparableEnd = isoDate(prevYear, prevMonthIndex, day);
  const previousComparableExpenseMinor = rows
    .filter(
      (row) =>
        row.kind === "expense" &&
        row.occurred_on >= prevStart &&
        row.occurred_on <= prevComparableEnd,
    )
    .reduce((sum, row) => sum + row.amount_minor, 0);

  // Totais por categoria no mês corrente (despesas, em valor positivo).
  const categoryTotals = new Map<string, number>();
  for (const row of currentMonth) {
    if (row.kind !== "expense") {
      continue;
    }
    const name = row.category?.name ?? "Sem categoria";
    categoryTotals.set(
      name,
      (categoryTotals.get(name) ?? 0) + Math.abs(row.amount_minor),
    );
  }

  // Média mensal de despesas dos 3 meses completos anteriores (com dados).
  const monthlyExpense = new Map<string, number>();
  for (const row of rows) {
    if (row.kind !== "expense" || row.occurred_on >= monthStart) {
      continue;
    }
    const key = row.occurred_on.slice(0, 7);
    monthlyExpense.set(
      key,
      (monthlyExpense.get(key) ?? 0) + Math.abs(row.amount_minor),
    );
  }
  const completeMonths = [...monthlyExpense.values()];
  const averageMonthlyExpenseMinor =
    completeMonths.length > 0
      ? Math.round(
          completeMonths.reduce((sum, value) => sum + value, 0) /
            completeMonths.length,
        )
      : 0;

  const netWorthMinor = balancesResult.data.reduce(
    (sum, row) => sum + (row.balance_minor ?? 0),
    0,
  );

  const label = monthLabel(year, monthIndex);
  const prevLabel = monthLabel(prevYear, prevMonthIndex);

  const insights = [
    savingsRateInsight({ incomeMinor, expenseMinor, monthLabel: label }),
    expenseComparisonInsight({
      currentExpenseMinor: expenseMinor,
      previousExpenseMinor: previousComparableExpenseMinor,
      day,
      monthLabel: label,
      previousMonthLabel: prevLabel,
    }),
    topCategoryInsight({
      categories: [...categoryTotals.entries()].map(([name, spentMinor]) => ({
        name,
        spentMinor,
      })),
      monthLabel: label,
    }),
    coverageInsight({
      netWorthMinor,
      averageMonthlyExpenseMinor,
      windowLabel: `média dos ${completeMonths.length} meses anteriores com dados`,
    }),
  ];

  return insights.filter((insight): insight is Insight => insight !== null);
}
