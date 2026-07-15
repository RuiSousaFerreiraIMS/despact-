import Link from "next/link";
import { notFound } from "next/navigation";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGoal } from "@/features/goals/actions";
import { getGoal } from "@/features/goals/queries";
import { minorUnitsToInputValue } from "@/lib/money/format";

/** Edição de objectivo: nome, alvo e data. O progresso actualiza-se na lista. */
export default async function EditGoalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const goal = await getGoal(id);

  if (!goal) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Editar objectivo
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <form action={updateGoal.bind(null, id)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={goal.name}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target_amount">Montante-alvo</Label>
              <Input
                id="target_amount"
                name="target_amount"
                type="text"
                inputMode="decimal"
                required
                defaultValue={minorUnitsToInputValue(goal.target_amount_minor)}
                className="h-10 font-display text-lg tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency_code">Moeda</Label>
              <Input
                id="currency_code"
                name="currency_code"
                type="text"
                readOnly
                defaultValue={goal.currency_code}
                className="h-10 bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target_date">Data-alvo (opcional)</Label>
              <Input
                id="target_date"
                name="target_date"
                type="date"
                defaultValue={goal.target_date ?? ""}
                className="h-10"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" size="lg">
                Guardar
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/goals">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
