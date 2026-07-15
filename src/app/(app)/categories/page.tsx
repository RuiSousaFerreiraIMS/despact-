import Link from "next/link";

import {
  archiveCategory,
  createCategory,
  unarchiveCategory,
} from "@/features/categories/actions";
import { listCategories } from "@/features/categories/queries";
import type { Category } from "@/features/categories/queries";
import {
  CATEGORY_TYPES,
  CATEGORY_TYPE_LABELS,
} from "@/features/categories/validation";

function CategoryList({
  title,
  categories,
}: {
  title: string;
  categories: Category[];
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-2 p-3"
          >
            <span
              className={
                category.archived_at ? "text-gray-400" : "font-medium"
              }
            >
              {category.name}
            </span>
            <span className="flex gap-4 text-sm">
              {category.archived_at === null ? (
                <>
                  <Link
                    href={`/categories/${category.id}/edit`}
                    className="py-1 underline"
                  >
                    Renomear
                  </Link>
                  <form action={archiveCategory.bind(null, category.id)}>
                    <button
                      type="submit"
                      className="py-1 text-gray-500 underline hover:text-gray-900"
                    >
                      Arquivar
                    </button>
                  </form>
                </>
              ) : (
                <form action={unarchiveCategory.bind(null, category.id)}>
                  <button
                    type="submit"
                    className="py-1 text-gray-500 underline hover:text-gray-900"
                  >
                    Reactivar
                  </button>
                </form>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Gestão de categorias: criação inline, listas separadas por tipo (D-005) e
 * secção de arquivadas. O tipo é fixo após a criação.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, categories] = await Promise.all([
    searchParams,
    listCategories(),
  ]);

  const activeExpense = categories.filter(
    (c) => c.type === "expense" && c.archived_at === null,
  );
  const activeIncome = categories.filter(
    (c) => c.type === "income" && c.archived_at === null,
  );
  const archived = categories.filter((c) => c.archived_at !== null);

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-semibold">Categorias</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form
        action={createCategory}
        className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 p-4"
      >
        <div className="min-w-40 flex-1 space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Nova categoria
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex.: Supermercado"
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
            defaultValue="expense"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {CATEGORY_TYPES.map((type) => (
              <option key={type} value={type}>
                {CATEGORY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Criar
        </button>
      </form>

      {activeExpense.length === 0 && activeIncome.length === 0 ? (
        <p className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
          Ainda não tem categorias. Crie algumas para classificar as suas
          transacções — por exemplo &quot;Supermercado&quot; (despesa) ou
          &quot;Salário&quot; (receita).
        </p>
      ) : null}

      <CategoryList title="Despesas" categories={activeExpense} />
      <CategoryList title="Receitas" categories={activeIncome} />
      <CategoryList title="Arquivadas" categories={archived} />
    </main>
  );
}
