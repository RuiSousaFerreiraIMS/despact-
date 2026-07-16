import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { listAccountsWithBalance } from "@/features/accounts/queries";
import { createTransfer } from "@/features/transactions/actions";

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Transferência entre contas próprias: par atómico criado pela função
 * create_transfer na base de dados (D-003). Neutra para o património.
 */
export default async function NewTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, accounts] = await Promise.all([
    searchParams,
    listAccountsWithBalance(),
  ]);

  const activeAccounts = accounts.filter(
    (account) => account.archived_at === null,
  );

  if (activeAccounts.length < 2) {
    return (
      <main className="mx-auto max-w-md space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Transferência
        </h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Uma transferência precisa de pelo menos duas contas activas.{" "}
            <Link
              href="/accounts/new"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Crie outra conta
            </Link>{" "}
            primeiro.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Transferência
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <form action={createTransfer} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="from_account_id">Da conta</Label>
              <NativeSelect
                id="from_account_id"
                name="from_account_id"
                required
                defaultValue=""
                className="h-10"
              >
                <option value="" disabled>
                  Escolha a conta de origem
                </option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id ?? ""}>
                    {account.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to_account_id">Para a conta</Label>
              <NativeSelect
                id="to_account_id"
                name="to_account_id"
                required
                defaultValue=""
                className="h-10"
              >
                <option value="" disabled>
                  Escolha a conta de destino
                </option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id ?? ""}>
                    {account.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Montante</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="0,00"
                className="h-10 font-display text-lg tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="occurred_on">Data</Label>
              <Input
                id="occurred_on"
                name="occurred_on"
                type="date"
                required
                defaultValue={todayIso()}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                name="description"
                type="text"
                className="h-10"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" size="lg">
                Transferir
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/transactions">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
