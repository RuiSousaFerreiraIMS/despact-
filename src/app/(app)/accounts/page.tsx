import Link from "next/link";

import { archiveAccount, unarchiveAccount } from "@/features/accounts/actions";
import { listAccountsWithBalance } from "@/features/accounts/queries";
import { ACCOUNT_TYPE_LABELS } from "@/features/accounts/validation";
import { formatMinorUnits } from "@/lib/money/format";

/**
 * Lista de contas com saldo derivado. Contas arquivadas aparecem numa secção
 * própria e podem ser reactivadas; nunca são eliminadas (D-004).
 */
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, accounts] = await Promise.all([
    searchParams,
    listAccountsWithBalance(),
  ]);

  const active = accounts.filter((account) => account.archived_at === null);
  const archived = accounts.filter((account) => account.archived_at !== null);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Contas</h1>
        <Link
          href="/accounts/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Nova conta
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {active.length === 0 ? (
        <p className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
          Ainda não tem contas. Crie a primeira para começar a registar a sua
          vida financeira.
        </p>
      ) : (
        <ul className="space-y-3">
          {active.map((account) => (
            <li
              key={account.id}
              className="rounded-md border border-gray-200 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-gray-500">
                    {account.type ? ACCOUNT_TYPE_LABELS[account.type] : ""}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMinorUnits(
                    account.balance_minor ?? 0,
                    account.currency_code ?? "EUR",
                  )}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <Link
                  href={`/accounts/${account.id}/edit`}
                  className="py-1 underline"
                >
                  Editar
                </Link>
                <form action={archiveAccount.bind(null, account.id ?? "")}>
                  <button
                    type="submit"
                    className="py-1 text-gray-500 underline hover:text-gray-900"
                  >
                    Arquivar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500">Arquivadas</h2>
          <ul className="space-y-3">
            {archived.map((account) => (
              <li
                key={account.id}
                className="rounded-md border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-600">{account.name}</p>
                    <p className="text-sm text-gray-400">
                      {account.type ? ACCOUNT_TYPE_LABELS[account.type] : ""}
                    </p>
                  </div>
                  <p className="text-lg font-semibold tabular-nums text-gray-500">
                    {formatMinorUnits(
                      account.balance_minor ?? 0,
                      account.currency_code ?? "EUR",
                    )}
                  </p>
                </div>
                <div className="mt-3 text-sm">
                  <form action={unarchiveAccount.bind(null, account.id ?? "")}>
                    <button
                      type="submit"
                      className="py-1 text-gray-500 underline hover:text-gray-900"
                    >
                      Reactivar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
