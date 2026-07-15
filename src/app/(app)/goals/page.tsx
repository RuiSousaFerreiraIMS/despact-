import Link from "next/link";

import {
  archiveGoal,
  completeGoal,
  reactivateGoal,
  updateGoalProgress,
} from "@/features/goals/actions";
import { listGoals } from "@/features/goals/queries";
import type { Goal } from "@/features/goals/queries";
import { formatMinorUnits, minorUnitsToInputValue } from "@/lib/money/format";

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function progressPercent(goal: Goal): number {
  if (goal.target_amount_minor <= 0) {
    return 0;
  }
  return Math.min(
    100,
    Math.round((goal.current_amount_minor / goal.target_amount_minor) * 100),
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const percent = progressPercent(goal);
  const reached = goal.current_amount_minor >= goal.target_amount_minor;
  const isActive = goal.status === "active";
  const isArchived = goal.status === "archived";

  return (
    <li
      className={`space-y-3 rounded-md border border-gray-200 p-4 ${
        isArchived ? "bg-gray-50" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`font-medium ${isArchived ? "text-gray-500" : ""}`}>
            {goal.name}
            {goal.status === "completed" ? (
              <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                Concluído
              </span>
            ) : null}
            {isActive && reached ? (
              <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                Alvo atingido
              </span>
            ) : null}
          </p>
          <p className="text-sm text-gray-500">
            {formatMinorUnits(goal.current_amount_minor, goal.currency_code)}{" "}
            de{" "}
            {formatMinorUnits(goal.target_amount_minor, goal.currency_code)}
            {goal.target_date
              ? ` · até ${formatDate(goal.target_date)}`
              : ""}
          </p>
        </div>
        <span className="text-lg font-semibold tabular-nums">{percent}%</span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${reached ? "bg-green-600" : "bg-gray-900"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {isActive ? (
        <form
          action={updateGoalProgress.bind(null, goal.id)}
          className="flex flex-wrap items-center gap-2"
        >
          <label htmlFor={`progress-${goal.id}`} className="text-sm">
            Progresso actual
          </label>
          <input
            id={`progress-${goal.id}`}
            name="current_amount"
            type="text"
            inputMode="decimal"
            defaultValue={minorUnitsToInputValue(goal.current_amount_minor)}
            className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Actualizar
          </button>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-4 text-sm">
        {isActive ? (
          <>
            <Link href={`/goals/${goal.id}/edit`} className="py-1 underline">
              Editar
            </Link>
            {reached ? (
              <form action={completeGoal.bind(null, goal.id)}>
                <button
                  type="submit"
                  className="py-1 text-green-700 underline hover:text-green-900"
                >
                  Marcar como concluído
                </button>
              </form>
            ) : null}
            <form action={archiveGoal.bind(null, goal.id)}>
              <button
                type="submit"
                className="py-1 text-gray-500 underline hover:text-gray-900"
              >
                Arquivar
              </button>
            </form>
          </>
        ) : (
          <form action={reactivateGoal.bind(null, goal.id)}>
            <button
              type="submit"
              className="py-1 text-gray-500 underline hover:text-gray-900"
            >
              Reactivar
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

/**
 * Objectivos com progresso manual (D-006). A actualização de progresso é
 * inline para manter o gesto frequente sem fricção.
 */
export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, goals] = await Promise.all([searchParams, listGoals()]);

  const active = goals.filter((goal) => goal.status === "active");
  const completed = goals.filter((goal) => goal.status === "completed");
  const archived = goals.filter((goal) => goal.status === "archived");

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Objectivos</h1>
        <Link
          href="/goals/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Novo objectivo
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {goals.length === 0 ? (
        <p className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
          Ainda não tem objectivos. Defina o primeiro — por exemplo um fundo
          de emergência — e acompanhe o progresso.
        </p>
      ) : (
        <>
          {active.length > 0 ? (
            <ul className="space-y-3">
              {active.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </ul>
          ) : null}

          {completed.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500">Concluídos</h2>
              <ul className="space-y-3">
                {completed.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </ul>
            </section>
          ) : null}

          {archived.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500">Arquivados</h2>
              <ul className="space-y-3">
                {archived.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
