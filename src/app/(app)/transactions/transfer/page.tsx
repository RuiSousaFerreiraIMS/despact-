import Link from "next/link";

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
      <main className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Transferência</h1>
        <p className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
          Uma transferência precisa de pelo menos duas contas activas.{" "}
          <Link href="/accounts/new" className="font-medium underline">
            Crie outra conta
          </Link>{" "}
          primeiro.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Transferência</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form action={createTransfer} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="from_account_id"
            className="block text-sm font-medium"
          >
            Da conta
          </label>
          <select
            id="from_account_id"
            name="from_account_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Escolha a conta de origem
            </option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id ?? ""}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="to_account_id" className="block text-sm font-medium">
            Para a conta
          </label>
          <select
            id="to_account_id"
            name="to_account_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Escolha a conta de destino
            </option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id ?? ""}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="amount" className="block text-sm font-medium">
            Montante
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            placeholder="0,00"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="occurred_on" className="block text-sm font-medium">
            Data
          </label>
          <input
            id="occurred_on"
            name="occurred_on"
            type="date"
            required
            defaultValue={todayIso()}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium">
            Descrição (opcional)
          </label>
          <input
            id="description"
            name="description"
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Transferir
          </button>
          <Link
            href="/transactions"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
