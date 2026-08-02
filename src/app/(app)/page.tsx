import { ArrowDownRight, ArrowUpRight, Lightbulb, PiggyBank } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { getDashboardCharts } from "@/features/dashboard/charts";
import {
  MonthlyFlowChart,
  SpendingByCategoryChart,
} from "@/features/dashboard/dashboard-charts";
import { getDashboardData } from "@/features/dashboard/queries";
import { getInsights } from "@/features/insights/queries";
import { categoryEmoji } from "@/features/categories/emoji";
import { createClient } from "@/lib/supabase/server";
import { formatMinorUnits } from "@/lib/money/format";
import { cn } from "@/lib/utils";

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

function monthLabel(monthStart: string): string {
  const [year, month] = monthStart.split("-");
  return `${MONTH_NAMES[Number.parseInt(month, 10) - 1]} ${year}`;
}

function goalPercent(current: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Painel — responde primeiro a "Como estou?" (D-002). O património líquido é
 * a tese da página; segue-se o mês corrente, contas e objectivos.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { netWorthMinor, activeAccounts, monthSummary, activeGoals },
    insights,
    charts,
  ] = await Promise.all([getDashboardData(), getInsights(), getDashboardCharts()]);

  const hasAccounts = activeAccounts.length > 0;

  return (
    <main className="space-y-8">
      {/* Tese: património líquido */}
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Património líquido
        </p>
        <p
          className={cn(
            "mt-2 font-display text-5xl font-semibold tracking-tight tabular-nums md:text-6xl",
            netWorthMinor < 0 && "text-destructive",
          )}
        >
          {formatMinorUnits(netWorthMinor, "EUR")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Soma dos saldos de todas as contas — dívidas contam negativamente.
        </p>
      </section>

      {!hasAccounts ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Comece por criar a sua primeira{" "}
            <Link
              href="/accounts/new"
              className="font-medium text-foreground underline underline-offset-4"
            >
              conta
            </Link>{" "}
            e registar movimentos.
          </CardContent>
        </Card>
      ) : (
        <section
          aria-label={`Resumo de ${monthLabel(monthSummary.monthStart)}`}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <Card>
            <CardContent className="flex items-start justify-between gap-2 py-5">
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-success">
                  {formatMinorUnits(monthSummary.incomeMinor, "EUR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {monthLabel(monthSummary.monthStart)}
                </p>
              </div>
              <span className="rounded-full bg-accent p-2 text-accent-foreground">
                <ArrowUpRight className="size-4" />
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-2 py-5">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                  {formatMinorUnits(monthSummary.expenseMinor, "EUR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {monthLabel(monthSummary.monthStart)}
                </p>
              </div>
              <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
                <ArrowDownRight className="size-4" />
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-2 py-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Poupança do mês
                </p>
                <p
                  className={cn(
                    "mt-1 font-display text-2xl font-semibold tabular-nums",
                    monthSummary.netMinor >= 0
                      ? "text-success"
                      : "text-destructive",
                  )}
                >
                  {formatMinorUnits(monthSummary.netMinor, "EUR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Receitas menos despesas
                </p>
              </div>
              <span className="rounded-full bg-accent p-2 text-accent-foreground">
                <PiggyBank className="size-4" />
              </span>
            </CardContent>
          </Card>
        </section>
      )}

      {hasAccounts ? (
        <section className="space-y-4" aria-label="Análise">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Onde gastei · {monthLabel(monthSummary.monthStart)}
              </h2>
              <Card>
                <CardContent>
                  <SpendingByCategoryChart data={charts.spendingByCategory} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Receita vs despesa · 6 meses
              </h2>
              <Card>
                <CardContent className="pt-4">
                  <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-success" />
                      Receita
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-slate-500" />
                      Despesa
                    </span>
                  </div>
                  <MonthlyFlowChart data={charts.monthlyFlow} />
                </CardContent>
              </Card>
            </div>
          </div>

          {charts.topExpenses.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Maiores despesas do mês
              </h2>
              <Card className="py-0">
                <ul className="divide-y divide-border">
                  {charts.topExpenses.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-base"
                        aria-hidden
                      >
                        {categoryEmoji(expense.categoryName)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {expense.description}
                      </span>
                      <span className="font-display font-semibold tabular-nums">
                        {formatMinorUnits(expense.amountMinor, "EUR")}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : null}
        </section>
      ) : null}

      {insights.length > 0 ? (
        <section className="space-y-3" aria-label="Insights">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Insights
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {insights.map((insight) => (
              <Card key={insight.id} size="sm">
                <CardContent className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      insight.tone === "positive" &&
                        "bg-accent text-accent-foreground",
                      insight.tone === "warning" &&
                        "bg-destructive/10 text-destructive",
                      insight.tone === "neutral" &&
                        "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <Lightbulb className="size-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{insight.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {insight.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {hasAccounts ? (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Contas
              </h2>
              <Link
                href="/accounts"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <Card className="py-0">
              <ul className="divide-y divide-border">
                {activeAccounts.map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <span className="truncate text-sm font-medium">
                      {account.name}
                    </span>
                    <span
                      className={cn(
                        "font-display font-semibold tabular-nums",
                        (account.balance_minor ?? 0) < 0 &&
                          "text-destructive",
                      )}
                    >
                      {formatMinorUnits(
                        account.balance_minor ?? 0,
                        account.currency_code ?? "EUR",
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Objectivos
            </h2>
            <Link
              href="/goals"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Sem objectivos activos.{" "}
                <Link
                  href="/goals/new"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Defina o primeiro
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              <ul className="divide-y divide-border">
                {activeGoals.map((goal) => {
                  const percent = goalPercent(
                    goal.current_amount_minor,
                    goal.target_amount_minor,
                  );
                  return (
                    <li key={goal.id} className="space-y-2 px-5 py-4">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">
                          {goal.name}
                        </span>
                        <span className="font-display tabular-nums text-muted-foreground">
                          {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
