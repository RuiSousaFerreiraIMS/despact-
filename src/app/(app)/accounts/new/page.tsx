import Link from "next/link";

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
      <h1 className="text-xl font-semibold">Nova conta</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form action={createAccount} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex.: Conta à ordem BCP"
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
            defaultValue="current"
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
            required
            defaultValue="EUR"
            maxLength={3}
            pattern="[A-Za-z]{3}"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
          />
          <p className="text-xs text-gray-500">
            Código ISO 4217. A moeda não pode ser alterada depois de criada.
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
            placeholder="0,00"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            Dívidas usam valor negativo: um cartão de crédito com 250 € em
            dívida tem saldo -250.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Criar conta
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
