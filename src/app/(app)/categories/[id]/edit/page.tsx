import Link from "next/link";
import { notFound } from "next/navigation";

import { renameCategory } from "@/features/categories/actions";
import { getCategory } from "@/features/categories/queries";
import { CATEGORY_TYPE_LABELS } from "@/features/categories/validation";

/** Renomear categoria. O tipo é fixo após a criação. */
export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Renomear categoria</h1>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form action={renameCategory.bind(null, id)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={category.name}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <span className="block text-sm font-medium">Tipo</span>
          <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            {CATEGORY_TYPE_LABELS[category.type]} — não pode ser alterado
            depois da criação.
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
            href="/categories"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
