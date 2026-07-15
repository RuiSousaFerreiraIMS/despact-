import type { Database } from "@/types/database";

export type CategoryType = Database["public"]["Enums"]["category_type"];

export const CATEGORY_TYPES: readonly CategoryType[] = [
  "expense",
  "income",
] as const;

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: "Receita",
  expense: "Despesa",
};

export interface CategoryInput {
  name: string;
  type: CategoryType;
}

/** Validação efectiva (no servidor) dos dados de uma categoria. */
export function parseCategoryForm(
  formData: FormData,
): { ok: true; value: CategoryInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");

  if (!name) {
    return { ok: false, error: "O nome da categoria é obrigatório." };
  }

  if (!CATEGORY_TYPES.includes(type as CategoryType)) {
    return { ok: false, error: "Escolha um tipo de categoria válido." };
  }

  return { ok: true, value: { name, type: type as CategoryType } };
}

/** Validação de renomeação (o tipo é fixo após a criação). */
export function parseCategoryRenameForm(
  formData: FormData,
): { ok: true; value: { name: string } } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { ok: false, error: "O nome da categoria é obrigatório." };
  }

  return { ok: true, value: { name } };
}
