import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  archiveCategory,
  createCategory,
  seedDefaultCategories,
  unarchiveCategory,
} from "@/features/categories/actions";
import { listCategories } from "@/features/categories/queries";
import type { Category } from "@/features/categories/queries";
import {
  CATEGORY_TYPES,
  CATEGORY_TYPE_LABELS,
} from "@/features/categories/validation";
import { cn } from "@/lib/utils";

function CategoryList({
  title,
  categories,
  archived,
}: {
  title: string;
  categories: Category[];
  archived?: boolean;
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <Card className={cn("py-0", archived && "bg-muted/40")}>
        <ul className="divide-y divide-border">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
            >
              <span
                className={cn(
                  "flex items-center gap-2 font-medium",
                  archived && "text-muted-foreground",
                )}
              >
                {category.name}
                {archived ? (
                  <Badge variant="secondary">
                    {CATEGORY_TYPE_LABELS[category.type]}
                  </Badge>
                ) : null}
              </span>
              <span className="flex gap-1">
                {archived ? (
                  <form action={unarchiveCategory.bind(null, category.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Reactivar
                    </Button>
                  </form>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/categories/${category.id}/edit`}>
                        Renomear
                      </Link>
                    </Button>
                    <form action={archiveCategory.bind(null, category.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Arquivar
                      </Button>
                    </form>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

/** Gestão de categorias: criação inline, listas por tipo (D-005). */
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
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Categorias
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <form
            action={createCategory}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-44 flex-1 space-y-1.5">
              <Label htmlFor="name">Nova categoria</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ex.: Supermercado"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <NativeSelect
                id="type"
                name="type"
                required
                defaultValue="expense"
                className="h-10 w-36"
              >
                {CATEGORY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CATEGORY_TYPE_LABELS[type]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" size="lg">
              Criar
            </Button>
          </form>
        </CardContent>
      </Card>

      {activeExpense.length === 0 && activeIncome.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center text-sm text-muted-foreground">
            <p>
              Ainda não tem categorias activas. Pode começar com um conjunto
              sugerido — Supermercado, Casa, Transportes, Salário e outras —
              e ajustá-lo à sua vida.
            </p>
            <form action={seedDefaultCategories}>
              <Button type="submit" size="lg">
                Adicionar categorias sugeridas
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <CategoryList title="Despesas" categories={activeExpense} />
      <CategoryList title="Receitas" categories={activeIncome} />
      <CategoryList title="Arquivadas" categories={archived} archived />
    </main>
  );
}
