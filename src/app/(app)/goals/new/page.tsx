import Link from "next/link";

import { createGoal } from "@/features/goals/actions";

/** Criação de objectivo (D-006): alvo positivo, data opcional, progresso manual. */
export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Novo objectivo</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form action={createGoal} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex.: Fundo de emergência"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="target_amount" className="block text-sm font-medium">
            Montante-alvo
          </label>
          <input
            id="target_amount"
            name="target_amount"
            type="text"
            inputMode="decimal"
            required
            placeholder="5000,00"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
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
        </div>

        <div className="space-y-1">
          <label htmlFor="target_date" className="block text-sm font-medium">
            Data-alvo (opcional)
          </label>
          <input
            id="target_date"
            name="target_date"
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Criar objectivo
          </button>
          <Link
            href="/goals"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
