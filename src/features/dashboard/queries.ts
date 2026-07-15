import { listAccountsWithBalance } from "@/features/accounts/queries";
import type { AccountWithBalance } from "@/features/accounts/queries";
import { listActiveGoals } from "@/features/goals/queries";
import type { Goal } from "@/features/goals/queries";
import { createClient } from "@/lib/supabase/server";

export interface MonthSummary {
  /** Primeiro dia do mês corrente (ISO). */
  monthStart: string;
  incomeMinor: number;
  /** Valor negativo (soma de despesas). */
  expenseMinor: number;
  /** incomeMinor + expenseMinor. */
  netMinor: number;
}

export interface DashboardData {
  /** Soma dos saldos derivados de todas as contas (D-002). */
  netWorthMinor: number;
  activeAccounts: AccountWithBalance[];
  monthSummary: MonthSummary;
  activeGoals: Goal[];
}

function currentMonthStart(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
}

/**
 * Dados do painel. O património líquido segue D-002: soma dos saldos de
 * todas as contas (dívidas contribuem negativamente); contas arquivadas
 * continuam a contar, conforme DATABASE.md. Transferências são neutras e
 * ficam fora do resumo mensal (D-003).
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const monthStart = currentMonthStart();

  const [accounts, activeGoals, monthResult] = await Promise.all([
    listAccountsWithBalance(),
    listActiveGoals(),
    supabase
      .from("transactions")
      .select("kind, amount_minor")
      .gte("occurred_on", monthStart)
      .in("kind", ["income", "expense"]),
  ]);

  if (monthResult.error) {
    throw new Error("Não foi possível carregar o resumo do mês.");
  }

  const incomeMinor = monthResult.data
    .filter((row) => row.kind === "income")
    .reduce((sum, row) => sum + row.amount_minor, 0);
  const expenseMinor = monthResult.data
    .filter((row) => row.kind === "expense")
    .reduce((sum, row) => sum + row.amount_minor, 0);

  const netWorthMinor = accounts.reduce(
    (sum, account) => sum + (account.balance_minor ?? 0),
    0,
  );

  return {
    netWorthMinor,
    activeAccounts: accounts.filter(
      (account) => account.archived_at === null,
    ),
    monthSummary: {
      monthStart,
      incomeMinor,
      expenseMinor,
      netMinor: incomeMinor + expenseMinor,
    },
    activeGoals,
  };
}
