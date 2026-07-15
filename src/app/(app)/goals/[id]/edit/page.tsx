import Link from "next/link";
import { notFound } from "next/navigation";

import { updateGoal } from "@/features/goals/actions";
import { getGoal } from "@/features/goals/queries";
import { minorUnitsToInputValue } from "@/lib/money/format";

/** Edição de objectivo: nome, alvo e data. O progresso actualiza-se na lista. */
export default async function EditGoalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const goal = await getGoal(id);

  if (!goal) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Editar objectivo</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form action={updateGoal.bind(null, id)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={goal.name}
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
            defaultValue={minorUnitsToInputValue(goal.target_amount_minor)}
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
            readOnly
            defaultValue={goal.currency_code}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
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
            defaultValue={goal.target_date ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Guardar
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
