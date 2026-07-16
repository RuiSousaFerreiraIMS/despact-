import { Plus } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  archiveGoal,
  completeGoal,
  reactivateGoal,
  updateGoalProgress,
} from "@/features/goals/actions";
import { goalPace } from "@/features/goals/pace";
import { listGoals } from "@/features/goals/queries";
import type { Goal } from "@/features/goals/queries";
import { formatMinorUnits, minorUnitsToInputValue } from "@/lib/money/format";
import { cn } from "@/lib/utils";

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
  const pace = isActive
    ? goalPace({
        targetAmountMinor: goal.target_amount_minor,
        currentAmountMinor: goal.current_amount_minor,
        targetDate: goal.target_date,
        today: new Date(),
      })
    : null;

  return (
    <Card className={cn(isArchived && "bg-muted/40")}>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p
              className={cn(
                "flex flex-wrap items-center gap-2 font-medium",
                isArchived && "text-muted-foreground",
              )}
            >
              {goal.name}
              {goal.status === "completed" ? (
                <Badge className="bg-success/15 text-success">Concluído</Badge>
              ) : null}
              {isActive && reached ? (
                <Badge className="bg-success/15 text-success">
                  Alvo atingido
                </Badge>
              ) : null}
              {isArchived ? <Badge variant="secondary">Arquivado</Badge> : null}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatMinorUnits(goal.current_amount_minor, goal.currency_code)}{" "}
              de{" "}
              {formatMinorUnits(goal.target_amount_minor, goal.currency_code)}
              {goal.target_date ? ` · até ${formatDate(goal.target_date)}` : ""}
            </p>
            {pace ? (
              <p
                className={cn(
                  "mt-1 text-sm",
                  pace.overdue ? "text-destructive" : "text-success",
                )}
              >
                {pace.overdue
                  ? `A data-alvo passou; faltam ${formatMinorUnits(pace.remainingMinor, goal.currency_code)}.`
                  : `Faltam ${formatMinorUnits(pace.remainingMinor, goal.currency_code)} — cerca de ${formatMinorUnits(pace.perMonthMinor, goal.currency_code)}/mês até à data-alvo.`}
              </p>
            ) : null}
          </div>
          <span className="font-display text-xl font-semibold tabular-nums">
            {percent}%
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        {isActive ? (
          <form
            action={updateGoalProgress.bind(null, goal.id)}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor={`progress-${goal.id}`} className="text-xs">
                Progresso actual
              </Label>
              <Input
                id={`progress-${goal.id}`}
                name="current_amount"
                type="text"
                inputMode="decimal"
                defaultValue={minorUnitsToInputValue(
                  goal.current_amount_minor,
                )}
                className="h-9 w-32 font-display tabular-nums"
              />
            </div>
            <Button type="submit" variant="outline">
              Actualizar
            </Button>
          </form>
        ) : null}

        <div className="flex flex-wrap gap-1">
          {isActive ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/goals/${goal.id}/edit`}>Editar</Link>
              </Button>
              {reached ? (
                <form action={completeGoal.bind(null, goal.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-success hover:text-success"
                  >
                    Marcar como concluído
                  </Button>
                </form>
              ) : null}
              <form action={archiveGoal.bind(null, goal.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Arquivar
                </Button>
              </form>
            </>
          ) : (
            <form action={reactivateGoal.bind(null, goal.id)}>
              <Button type="submit" variant="ghost" size="sm">
                Reactivar
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Objectivos com progresso manual (D-006); actualização inline sem fricção. */
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Objectivos
        </h1>
        <Button asChild>
          <Link href="/goals/new">
            <Plus data-icon="inline-start" />
            Novo objectivo
          </Link>
        </Button>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ainda não tem objectivos. Defina o primeiro — por exemplo um fundo
            de emergência — e acompanhe o progresso.
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {active.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : null}

          {completed.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Concluídos
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {completed.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          ) : null}

          {archived.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Arquivados
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {archived.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
