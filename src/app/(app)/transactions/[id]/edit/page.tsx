import { notFound, redirect } from "next/navigation";

import { listAccountsWithBalance } from "@/features/accounts/queries";
import { listActiveCategories } from "@/features/categories/queries";
import { updateTransaction } from "@/features/transactions/actions";
import { getTransaction } from "@/features/transactions/queries";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { minorUnitsToInputValue } from "@/lib/money/format";

/**
 * Edição de receita/despesa. Transferências não se editam aqui: eliminam-se
 * e recriam-se como par atómico (D-003).
 */
export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const transaction = await getTransaction(id);

  if (!transaction) {
    notFound();
  }

  if (transaction.kind === "transfer") {
    redirect("/transactions");
  }

  const [accounts, categories] = await Promise.all([
    listAccountsWithBalance(),
    listActiveCategories(),
  ]);

  const activeAccounts = accounts
    .filter(
      (account) =>
        account.archived_at === null || account.id === transaction.account_id,
    )
    .map((account) => ({
      id: account.id ?? "",
      name: account.name ?? "",
    }));

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Editar transacção</h1>

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
        action={updateTransaction.bind(null, id)}
        initial={{
          kind: transaction.kind === "income" ? "income" : "expense",
          accountId: transaction.account_id,
          amount: minorUnitsToInputValue(
            Math.abs(transaction.amount_minor),
          ),
          occurredOn: transaction.occurred_on,
          description: transaction.description ?? "",
          categoryId: transaction.category_id ?? "",
        }}
        submitLabel="Guardar"
      />
    </main>
  );
}
