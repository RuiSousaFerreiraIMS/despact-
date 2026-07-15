import Link from "next/link";
import { notFound } from "next/navigation";

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
      <h1 className="text-xl font-semibold">Editar conta</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form action={updateAccount.bind(null, id)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={account.name ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="type" className="block text-sm font-medium">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={account.type ?? "current"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {ACCOUNT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="currency_code" className="block text-sm font-medium">
            Moeda
          </label>
          <input
            id="currency_code"
            name="currency_code"
            type="text"
            readOnly
            defaultValue={account.currency_code ?? "EUR"}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
          <p className="text-xs text-gray-500">
            A moeda não pode ser alterada depois de criada.
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="opening_balance"
            className="block text-sm font-medium"
          >
            Saldo inicial
          </label>
          <input
            id="opening_balance"
            name="opening_balance"
            type="text"
            inputMode="decimal"
            defaultValue={minorUnitsToInputValue(
              account.opening_balance_minor ?? 0,
            )}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            Alterar o saldo inicial recalcula o saldo actual da conta.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Guardar
          </button>
          <Link
            href="/accounts"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
