import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createAccount } from "@/features/accounts/actions";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
} from "@/features/accounts/validation";

/** Criação de conta. O saldo inicial é assinado: dívidas usam valor negativo (D-002). */
export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Nova conta
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <form action={createAccount} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ex.: Conta à ordem BCP"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <NativeSelect
                id="type"
                name="type"
                required
                defaultValue="current"
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
                required
                defaultValue="EUR"
                maxLength={3}
                pattern="[A-Za-z]{3}"
                className="h-10 uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Código ISO 4217. A moeda não pode ser alterada depois de
                criada.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opening_balance">Saldo inicial</Label>
              <Input
                id="opening_balance"
                name="opening_balance"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Dívidas usam valor negativo: um cartão de crédito com 250 €
                em dívida tem saldo -250.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <SubmitButton size="lg" pendingLabel="A criar…">
                Criar conta
              </SubmitButton>
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
