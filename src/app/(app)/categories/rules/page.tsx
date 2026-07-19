import { Sparkles } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  applyRulesToUncategorized,
  createRule,
  deleteRule,
} from "@/features/categorization/actions";
import { listRules } from "@/features/categorization/queries";
import { listActiveCategories } from "@/features/categories/queries";

const MATCH_LABELS: Record<string, string> = {
  contains: "contém",
  starts_with: "começa por",
  equals: "é igual a",
};

/**
 * Regras de categorização (D-011): cada regra atribui uma categoria a
 * movimentos sem categoria cuja descrição corresponde ao padrão. Aplicam-se
 * automaticamente ao importar do banco e a pedido aos movimentos existentes.
 */
export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ error, message }, rules, categories] = await Promise.all([
    searchParams,
    listRules(),
    listActiveCategories(),
  ]);

  return (
    <main className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Regras de categorização
          </h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">Voltar a categorias</Link>
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Categorize movimentos automaticamente pela descrição. As regras
          nunca alteram categorias que definiu à mão.
        </p>
      </div>

      {message ? <FormAlert variant="success">{message}</FormAlert> : null}
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Crie primeiro algumas{" "}
            <Link
              href="/categories"
              className="font-medium text-foreground underline underline-offset-4"
            >
              categorias
            </Link>{" "}
            para as poder usar nas regras.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <form
              action={createRule}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end"
            >
              <div className="space-y-1.5">
                <Label htmlFor="pattern">Se a descrição…</Label>
                <div className="flex gap-2">
                  <NativeSelect
                    name="match_type"
                    defaultValue="contains"
                    className="h-10 w-32"
                    aria-label="Tipo de correspondência"
                  >
                    <option value="contains">contém</option>
                    <option value="starts_with">começa por</option>
                    <option value="equals">é igual a</option>
                  </NativeSelect>
                  <Input
                    id="pattern"
                    name="pattern"
                    type="text"
                    required
                    placeholder="Ex.: continente"
                    className="h-10"
                  />
                </div>
              </div>
              <span className="hidden pb-2.5 text-sm text-muted-foreground sm:inline">
                →
              </span>
              <div className="space-y-1.5">
                <Label htmlFor="category_id">Atribuir a categoria</Label>
                <NativeSelect
                  id="category_id"
                  name="category_id"
                  required
                  defaultValue=""
                  className="h-10"
                >
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} (
                      {category.type === "income" ? "receita" : "despesa"})
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <Button type="submit" size="lg">
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {rules.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
          Ainda não tem regras. Crie uma acima — por exemplo, descrição contém
          &quot;continente&quot; → Supermercado.
        </p>
      ) : (
        <>
          <Card className="py-0">
            <ul className="divide-y divide-border">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                >
                  <span className="text-sm">
                    Descrição {MATCH_LABELS[rule.matchType]}{" "}
                    <span className="font-medium">“{rule.pattern}”</span> →{" "}
                    <Badge
                      variant="secondary"
                      className={
                        rule.categoryType === "income"
                          ? "bg-success/15 text-success"
                          : undefined
                      }
                    >
                      {rule.categoryName}
                    </Badge>
                  </span>
                  <form action={deleteRule.bind(null, rule.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Apagar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>

          <form action={applyRulesToUncategorized}>
            <Button type="submit" variant="outline">
              <Sparkles data-icon="inline-start" />
              Aplicar às não categorizadas
            </Button>
          </form>
        </>
      )}
    </main>
  );
}
