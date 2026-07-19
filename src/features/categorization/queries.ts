import { createClient } from "@/lib/supabase/server";

import type { CategorizationRule, MatchType } from "./rules";

export interface RuleWithCategory extends CategorizationRule {
  categoryName: string;
}

interface RuleRow {
  id: string;
  pattern: string;
  match_type: MatchType;
  category_id: string;
  priority: number;
  category: { name: string; type: "income" | "expense" } | null;
}

function toRule(row: RuleRow): RuleWithCategory | null {
  if (!row.category) {
    return null;
  }
  return {
    id: row.id,
    pattern: row.pattern,
    matchType: row.match_type,
    categoryId: row.category_id,
    categoryType: row.category.type,
    priority: row.priority,
    categoryName: row.category.name,
  };
}

/** Regras do utilizador, por prioridade, com o nome e tipo da categoria. */
export async function listRules(): Promise<RuleWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorization_rules")
    .select(
      "id, pattern, match_type, category_id, priority, category:categories(name, type)",
    )
    .order("priority")
    .order("created_at");

  if (error) {
    throw new Error("Não foi possível carregar as regras.");
  }

  return (data as RuleRow[])
    .map(toRule)
    .filter((rule): rule is RuleWithCategory => rule !== null);
}

/** Regras num formato pronto para o motor `categorize` (sem nome). */
export async function loadRulesForEngine(): Promise<CategorizationRule[]> {
  const rules = await listRules();
  return rules.map((rule) => ({
    id: rule.id,
    pattern: rule.pattern,
    matchType: rule.matchType,
    categoryId: rule.categoryId,
    categoryType: rule.categoryType,
    priority: rule.priority,
  }));
}
