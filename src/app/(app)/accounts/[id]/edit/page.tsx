import Link from "next/link";
import { notFound } from "next/navigation";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { updateAccount } from "@/features/accounts/actions";
import { getAccount } from "@/features/accounts/queries";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
} from "@/features/accounts/validation";
import { minorUnitsToInputValue } from "@/lib/money/format";

/** Edição de conta. A moeda é fixa após a criação (coerência com transacções). */
export default async function EditAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const account = await getAccount(id);

  if (!account) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Editar conta
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <form action={updateAccount.bind(null, id)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={account.name ?? ""}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <NativeSelect
                id="type"
                name="type"
                required
                defaultValue={account.type ?? "current"}
                className="h-10"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ACCOUNT_TYPE_LABELS[type]}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency_code">Moeda</Label>
              <Input
                id="currency_code"
                name="currency_code"
                type="text"
                readOnly
                defaultValue={account.currency_code ?? "EUR"}
                className="h-10 bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                A moeda não pode ser alterada depois de criada.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opening_balance">Saldo inicial</Label>
              <Input
                id="opening_balance"
                name="opening_balance"
                type="text"
                inputMode="decimal"
                defaultValue={minorUnitsToInputValue(
                  account.opening_balance_minor ?? 0,
                )}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Alterar o saldo inicial recalcula o saldo actual da conta.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" size="lg">
                Guardar
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/accounts">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
