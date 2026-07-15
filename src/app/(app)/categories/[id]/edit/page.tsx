import Link from "next/link";
import { notFound } from "next/navigation";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Renomear categoria
      </h1>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Card>
        <CardContent>
          <form action={renameCategory.bind(null, id)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={category.name}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {CATEGORY_TYPE_LABELS[category.type]} — não pode ser alterado
                depois da criação.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" size="lg">
                Guardar
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/categories">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
