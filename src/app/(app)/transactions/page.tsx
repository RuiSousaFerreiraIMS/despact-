import Link from "next/link";

import {
  deleteTransaction,
  deleteTransfer,
} from "@/features/transactions/actions";
import { listRecentTransactions } from "@/features/transactions/queries";
import type { TransactionListItem } from "@/features/transactions/queries";
import { formatMinorUnits } from "@/lib/money/format";

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function TransactionRow({ transaction }: { transaction: TransactionListItem }) {
  const isTransfer = transaction.kind === "transfer";
  const amountClass =
    transaction.kind === "income"
      ? "text-green-700"
      : isTransfer
        ? "text-gray-500"
        : "text-gray-900";

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {transaction.description ??
            transaction.category?.name ??
            (isTransfer ? "Transferência" : "Sem descrição")}
        </p>
        <p className="text-sm text-gray-500">
          {formatDate(transaction.occurred_on)} · {transaction.account?.name}
          {isTransfer ? (
            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              Transferência
            </span>
          ) : transaction.category?.name && transaction.description ? (
            <span className="ml-2 text-xs">{transaction.category.name}</span>
          ) : null}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`font-semibold tabular-nums ${amountClass}`}>
          {formatMinorUnits(transaction.amount_minor, transaction.currency_code)}
        </span>
        <span className="flex gap-3 text-sm">
          {isTransfer ? (
            transaction.amount_minor < 0 && transaction.transfer_id ? (
              <form action={deleteTransfer.bind(null, transaction.transfer_id)}>
                <button
                  type="submit"
                  className="py-1 text-gray-500 underline hover:text-gray-900"
                >
                  Eliminar
                </button>
              </form>
            ) : null
          ) : (
            <>
              <Link
                href={`/transactions/${transaction.id}/edit`}
                className="py-1 underline"
              >
                Editar
              </Link>
              <form action={deleteTransaction.bind(null, transaction.id)}>
                <button
                  type="submit"
                  className="py-1 text-gray-500 underline hover:text-gray-900"
                >
                  Eliminar
                </button>
              </form>
            </>
          )}
        </span>
      </div>
    </li>
  );
}

/**
 * Histórico de movimentos. Transferências aparecem como os seus dois lados,
 * identificados; eliminar um lado elimina o par (operação atómica na base de
 * dados). Eliminar aparece apenas no lado negativo para não duplicar a acção.
 */
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, transactions] = await Promise.all([
    searchParams,
    listRecentTransactions(),
  ]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Transacções</h1>
        <div className="flex gap-2">
          <Link
            href="/transactions/transfer"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Transferência
          </Link>
          <Link
            href="/transactions/new"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Nova transacção
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {transactions.length === 0 ? (
        <p className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
          Ainda não tem movimentos. Registe a primeira despesa ou receita —
          demora menos de 15 segundos.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}
    </main>
  );
}
