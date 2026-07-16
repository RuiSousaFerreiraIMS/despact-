import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Card, CardContent } from "@/components/ui/card";
import { listAccountsWithBalance } from "@/features/accounts/queries";
import { listActiveCategories } from "@/features/categories/queries";
import { createTransaction } from "@/features/transactions/actions";
import { TransactionForm } from "@/features/transactions/transaction-form";

/** Registo de receita/despesa — o fluxo dos 15 segundos. */
export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, accounts, categories] = await Promise.all([
    searchParams,
    listAccountsWithBalance(),
    listActiveCategories(),
  ]);

  const activeAccounts = accounts
    .filter((account) => account.archived_at === null)
    .map((account) => ({
      id: account.id ?? "",
      name: account.name ?? "",
    }));

  if (activeAccounts.length === 0) {
    return (
      <main className="mx-auto max-w-md space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Novo movimento
        </h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Antes de registar movimentos, crie a sua primeira{" "}
            <Link
              href="/accounts/new"
              className="font-medium text-foreground underline underline-offset-4"
            >
              conta
            </Link>
            .
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Novo movimento
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <TransactionForm
            accounts={activeAccounts}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              type: category.type,
            }))}
            action={createTransaction}
            submitLabel="Registar"
          />
        </CardContent>
      </Card>
    </main>
  );
}
