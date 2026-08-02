import { createClient } from "@/lib/supabase/server";

/**
 * Agregações para os gráficos do painel. Cálculos determinísticos sobre os
 * movimentos do utilizador (RLS aplica-se); transferências ficam de fora
 * (D-003, são neutras).
 */

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export interface CategorySpend {
  name: string;
  spentMinor: number;
}

export interface MonthlyFlow {
  label: string;
  incomeMinor: number;
  /** Positivo (magnitude das despesas). */
  expenseMinor: number;
}

export interface TopExpense {
  id: string;
  description: string;
  categoryName: string | null;
  amountMinor: number;
  occurredOn: string;
}

export interface DashboardCharts {
  spendingByCategory: CategorySpend[];
  monthlyFlow: MonthlyFlow[];
  topExpenses: TopExpense[];
}

function isoMonthStart(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
}

/**
 * Dados dos gráficos: gastos por categoria e maiores despesas do mês
 * corrente, e receita vs despesa dos últimos 6 meses.
 */
export async function getDashboardCharts(
  now = new Date(),
): Promise<DashboardCharts> {
  const supabase = await createClient();

  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const monthStart = isoMonthStart(year, monthIndex);

  // Janela de 6 meses (incluindo o corrente).
  const windowStartIndex = monthIndex - 5;
  const windowYear = windowStartIndex < 0 ? year - 1 : year;
  const windowMonthIndex = ((windowStartIndex % 12) + 12) % 12;
  const windowStart = isoMonthStart(windowYear, windowMonthIndex);

  const [monthRes, windowRes, topRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount_minor, category:categories(name)")
      .eq("kind", "expense")
      .gte("occurred_on", monthStart),
    supabase
      .from("transactions")
      .select("kind, amount_minor, occurred_on")
      .in("kind", ["income", "expense"])
      .gte("occurred_on", windowStart),
    supabase
      .from("transactions")
      .select("id, description, amount_minor, occurred_on, category:categories(name)")
      .eq("kind", "expense")
      .gte("occurred_on", monthStart)
      .order("amount_minor", { ascending: true })
      .limit(5),
  ]);

  if (monthRes.error || windowRes.error || topRes.error) {
    throw new Error("Não foi possível calcular os gráficos.");
  }

  // Gastos por categoria (mês corrente), ordenados do maior para o menor.
  const byCategory = new Map<string, number>();
  for (const row of monthRes.data as {
    amount_minor: number;
    category: { name: string } | null;
  }[]) {
    const name = row.category?.name ?? "Sem categoria";
    byCategory.set(name, (byCategory.get(name) ?? 0) + Math.abs(row.amount_minor));
  }
  const spendingByCategory = [...byCategory.entries()]
    .map(([name, spentMinor]) => ({ name, spentMinor }))
    .sort((a, b) => b.spentMinor - a.spentMinor);

  // Receita vs despesa por mês (últimos 6 meses).
  const flowByMonth = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < 6; i++) {
    const idx = ((monthIndex - 5 + i) % 12 + 12) % 12;
    const y = monthIndex - 5 + i < 0 ? year - 1 : year;
    flowByMonth.set(`${y}-${idx}`, { income: 0, expense: 0 });
  }
  for (const row of windowRes.data as {
    kind: string;
    amount_minor: number;
    occurred_on: string;
  }[]) {
    const [y, m] = row.occurred_on.split("-");
    const key = `${Number(y)}-${Number(m) - 1}`;
    const bucket = flowByMonth.get(key);
    if (!bucket) {
      continue;
    }
    if (row.kind === "income") {
      bucket.income += row.amount_minor;
    } else {
      bucket.expense += Math.abs(row.amount_minor);
    }
  }
  const monthlyFlow: MonthlyFlow[] = [...flowByMonth.entries()].map(
    ([key, v]) => {
      const idx = Number(key.split("-")[1]);
      return {
        label: MONTH_NAMES[idx],
        incomeMinor: v.income,
        expenseMinor: v.expense,
      };
    },
  );

  const topExpenses: TopExpense[] = (
    topRes.data as {
      id: string;
      description: string | null;
      amount_minor: number;
      occurred_on: string;
      category: { name: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    description: row.description ?? row.category?.name ?? "Despesa",
    categoryName: row.category?.name ?? null,
    amountMinor: row.amount_minor,
    occurredOn: row.occurred_on,
  }));

  return { spendingByCategory, monthlyFlow, topExpenses };
}
