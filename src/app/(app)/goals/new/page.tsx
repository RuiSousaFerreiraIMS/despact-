import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGoal } from "@/features/goals/actions";

/** Criação de objectivo (D-006): alvo positivo, data opcional, progresso manual. */
export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Novo objectivo
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <form action={createGoal} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ex.: Fundo de emergência"
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
                placeholder="5000,00"
                className="h-10 font-display text-lg tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency_code">Moeda</Label>
              <Input
                id="currency_code"
                name="currency_code"
                type="text"
                required
                defaultValue="EUR"
                maxLength={3}
                pattern="[A-Za-z]{3}"
                className="h-10 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target_date">Data-alvo (opcional)</Label>
              <Input
                id="target_date"
                name="target_date"
                type="date"
                className="h-10"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" size="lg">
                Criar objectivo
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
