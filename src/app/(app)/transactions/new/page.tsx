import Link from "next/link";

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
      <main className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Nova transacção</h1>
        <p className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
          Antes de registar movimentos, crie a sua primeira{" "}
          <Link href="/accounts/new" className="font-medium underline">
            conta
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Nova transacção</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

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
    </main>
  );
}
