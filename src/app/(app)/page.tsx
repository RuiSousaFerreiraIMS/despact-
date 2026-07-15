import Link from "next/link";
import { redirect } from "next/navigation";

import { getDashboardData } from "@/features/dashboard/queries";
import { createClient } from "@/lib/supabase/server";
import { formatMinorUnits } from "@/lib/money/format";

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
 * Painel — responde primeiro a "Como estou?" (D-002): património líquido,
 * resumo do mês, contas e objectivos. Detalhe histórico fica nas páginas
 * próprias; aqui só indicadores de decisão.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { netWorthMinor, activeAccounts, monthSummary, activeGoals } =
    await getDashboardData();

  const hasAccounts = activeAccounts.length > 0;

  return (
    <main className="space-y-6">
      <section className="rounded-md border border-gray-200 p-6">
        <p className="text-sm text-gray-500">Património líquido</p>
        <p
          className={`text-3xl font-semibold tabular-nums ${
            netWorthMinor < 0 ? "text-red-700" : ""
          }`}
        >
          {formatMinorUnits(netWorthMinor, "EUR")}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Soma dos saldos de todas as contas; dívidas contam negativamente.
        </p>
      </section>

      {!hasAccounts ? (
        <p className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
          Comece por criar a sua primeira{" "}
          <Link href="/accounts/new" className="font-medium underline">
            conta
          </Link>{" "}
          e registar movimentos.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-sm text-gray-500">
              Receitas · {monthLabel(monthSummary.monthStart)}
            </p>
            <p className="text-xl font-semibold tabular-nums text-green-700">
              {formatMinorUnits(monthSummary.incomeMinor, "EUR")}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-sm text-gray-500">
              Despesas · {monthLabel(monthSummary.monthStart)}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMinorUnits(monthSummary.expenseMinor, "EUR")}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Poupança do mês</p>
            <p
              className={`text-xl font-semibold tabular-nums ${
                monthSummary.netMinor >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {formatMinorUnits(monthSummary.netMinor, "EUR")}
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {hasAccounts ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-500">Contas</h2>
              <Link href="/accounts" className="text-sm underline">
                Ver todas
              </Link>
            </div>
            <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
              {activeAccounts.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <span className="truncate">{account.name}</span>
                  <span className="font-semibold tabular-nums">
                    {formatMinorUnits(
                      account.balance_minor ?? 0,
                      account.currency_code ?? "EUR",
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Objectivos</h2>
            <Link href="/goals" className="text-sm underline">
              Ver todos
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <p className="rounded-md border border-gray-200 p-4 text-sm text-gray-500">
              Sem objectivos activos.{" "}
              <Link href="/goals/new" className="font-medium underline">
                Defina o primeiro
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {activeGoals.map((goal) => {
                const percent = goalPercent(
                  goal.current_amount_minor,
                  goal.target_amount_minor,
                );
                return (
                  <li
                    key={goal.id}
                    className="space-y-2 rounded-md border border-gray-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{goal.name}</span>
                      <span className="tabular-nums text-gray-500">
                        {percent}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${
                          percent >= 100 ? "bg-green-600" : "bg-gray-900"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
