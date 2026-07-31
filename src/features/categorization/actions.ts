"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { categorize } from "./rules";
import type { MatchType } from "./rules";
import { loadRulesForEngine } from "./queries";
import { SUGGESTED_RULES } from "./suggested";

const MATCH_TYPES: MatchType[] = ["contains", "starts_with", "equals"];

/**
 * Aplica as regras aos movimentos sem categoria. Devolve quantos actualizou.
 * Reutilizado pela acção manual e pela sementeira de regras sugeridas.
 */
async function applyRulesToPending(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number> {
  const rules = await loadRulesForEngine();
  if (rules.length === 0) {
    return 0;
  }

  const { data: pending, error } = await supabase
    .from("transactions")
    .select("id, description, kind")
    .is("category_id", null)
    .in("kind", ["income", "expense"]);

  if (error || !pending) {
    return 0;
  }

  let updated = 0;
  for (const transaction of pending) {
    const categoryId = categorize(
      {
        description: transaction.description,
        kind: transaction.kind as "income" | "expense",
      },
      rules,
    );
    if (categoryId) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ category_id: categoryId })
        .eq("id", transaction.id);
      if (!updateError) {
        updated += 1;
      }
    }
  }
  return updated;
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user.id;
}

export async function createRule(formData: FormData) {
  const userId = await requireUserId();
  const pattern = String(formData.get("pattern") ?? "").trim();
  const matchType = String(formData.get("match_type") ?? "contains");
  const categoryId = String(formData.get("category_id") ?? "");

  if (!pattern) {
    redirect(
      `/categories/rules?error=${encodeURIComponent("Indique o texto a procurar.")}`,
    );
  }
  if (!MATCH_TYPES.includes(matchType as MatchType)) {
    redirect(
      `/categories/rules?error=${encodeURIComponent("Tipo de correspondência inválido.")}`,
    );
  }
  if (!categoryId) {
    redirect(
      `/categories/rules?error=${encodeURIComponent("Escolha a categoria a atribuir.")}`,
    );
  }

  const supabase = await createClient();

  // Nova regra fica no fim da ordem de prioridade.
  const { data: last } = await supabase
    .from("categorization_rules")
    .select("priority")
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categorization_rules").insert({
    user_id: userId,
    pattern,
    match_type: matchType,
    category_id: categoryId,
    priority: (last?.priority ?? -1) + 1,
  });

  if (error) {
    redirect(
      `/categories/rules?error=${encodeURIComponent("Não foi possível criar a regra.")}`,
    );
  }

  revalidatePath("/categories/rules");
  redirect("/categories/rules");
}

export async function deleteRule(id: string) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorization_rules")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(
      `/categories/rules?error=${encodeURIComponent("Não foi possível apagar a regra.")}`,
    );
  }

  revalidatePath("/categories/rules");
  redirect("/categories/rules");
}

/**
 * Aplica as regras aos movimentos sem categoria do utilizador. Só preenche
 * onde não há categoria (nunca sobrepõe escolhas manuais) e respeita o tipo.
 */
export async function applyRulesToUncategorized() {
  await requireUserId();
  const supabase = await createClient();
  const rules = await loadRulesForEngine();

  if (rules.length === 0) {
    redirect(
      `/categories/rules?message=${encodeURIComponent("Crie regras primeiro para as poder aplicar.")}`,
    );
  }

  const updated = await applyRulesToPending(supabase);

  revalidatePath("/categories/rules");
  revalidatePath("/transactions");
  redirect(
    `/categories/rules?message=${encodeURIComponent(
      updated === 0
        ? "Nenhum movimento sem categoria correspondeu às regras."
        : `${updated} movimentos categorizados.`,
    )}`,
  );
}

/**
 * Adiciona regras sugeridas para comerciantes comuns (criando categorias em
 * falta) e aplica-as logo aos movimentos sem categoria. Idempotente: não
 * duplica regras já existentes.
 */
export async function seedSuggestedRules() {
  const userId = await requireUserId();
  const supabase = await createClient();

  // Categorias activas do utilizador, indexadas por tipo + nome minúsculo.
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .is("archived_at", null);

  const catKey = (type: string, name: string) =>
    `${type}:${name.toLowerCase()}`;
  const catMap = new Map<string, string>();
  for (const c of categories ?? []) {
    catMap.set(catKey(c.type, c.name), c.id);
  }

  // Garantir que existem as categorias referidas pelas regras sugeridas.
  const neededCategories = new Map<
    string,
    { name: string; type: "income" | "expense" }
  >();
  for (const rule of SUGGESTED_RULES) {
    const key = catKey(rule.categoryType, rule.categoryName);
    if (!catMap.has(key) && !neededCategories.has(key)) {
      neededCategories.set(key, {
        name: rule.categoryName,
        type: rule.categoryType,
      });
    }
  }
  for (const [key, cat] of neededCategories) {
    const { data: created } = await supabase
      .from("categories")
      .insert({ user_id: userId, name: cat.name, type: cat.type })
      .select("id")
      .single();
    if (created) {
      catMap.set(key, created.id);
    }
  }

  // Regras já existentes, para não duplicar (por padrão + categoria).
  const { data: existingRules } = await supabase
    .from("categorization_rules")
    .select("pattern, category_id, priority");
  const existingKey = new Set(
    (existingRules ?? []).map(
      (r) => `${r.category_id}:${r.pattern.toLowerCase()}`,
    ),
  );
  let priority =
    (existingRules ?? []).reduce((max, r) => Math.max(max, r.priority), -1) + 1;

  const toInsert: {
    user_id: string;
    pattern: string;
    match_type: string;
    category_id: string;
    priority: number;
  }[] = [];
  for (const rule of SUGGESTED_RULES) {
    const categoryId = catMap.get(
      catKey(rule.categoryType, rule.categoryName),
    );
    if (!categoryId) {
      continue;
    }
    if (existingKey.has(`${categoryId}:${rule.pattern.toLowerCase()}`)) {
      continue;
    }
    toInsert.push({
      user_id: userId,
      pattern: rule.pattern,
      match_type: "contains",
      category_id: categoryId,
      priority: priority++,
    });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("categorization_rules")
      .insert(toInsert);
    if (error) {
      redirect(
        `/categories/rules?error=${encodeURIComponent("Não foi possível adicionar as regras sugeridas.")}`,
      );
    }
  }

  const categorized = await applyRulesToPending(supabase);

  revalidatePath("/categories/rules");
  revalidatePath("/transactions");
  redirect(
    `/categories/rules?message=${encodeURIComponent(
      `${toInsert.length} regras adicionadas; ${categorized} movimentos categorizados.`,
    )}`,
  );
}
