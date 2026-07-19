"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { categorize } from "./rules";
import type { MatchType } from "./rules";
import { loadRulesForEngine } from "./queries";

const MATCH_TYPES: MatchType[] = ["contains", "starts_with", "equals"];

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

  const { data: pending, error } = await supabase
    .from("transactions")
    .select("id, description, kind")
    .is("category_id", null)
    .in("kind", ["income", "expense"]);

  if (error) {
    redirect(
      `/categories/rules?error=${encodeURIComponent("Não foi possível carregar os movimentos.")}`,
    );
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
