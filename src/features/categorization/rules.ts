/**
 * Motor de categorização (D-011): funções puras e determinísticas que
 * escolhem a categoria de um movimento a partir da descrição. Não acede a
 * dados nem a datas; toda a I/O fica nas camadas que o usam.
 */

export type MatchType = "contains" | "starts_with" | "equals";
export type EntryKind = "income" | "expense";

export interface CategorizationRule {
  id: string;
  pattern: string;
  matchType: MatchType;
  categoryId: string;
  categoryType: EntryKind;
  priority: number;
}

/** Normaliza para comparação sem acentos nem maiúsculas. */
function normalize(value: string): string {
  const decomposed = value.normalize("NFD");
  let result = "";
  for (const char of decomposed) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x0300 || code > 0x036f) {
      result += char;
    }
  }
  return result.toLowerCase().trim();
}

function matches(description: string, rule: CategorizationRule): boolean {
  const haystack = normalize(description);
  const needle = normalize(rule.pattern);

  if (needle === "") {
    return false;
  }

  switch (rule.matchType) {
    case "contains":
      return haystack.includes(needle);
    case "starts_with":
      return haystack.startsWith(needle);
    case "equals":
      return haystack === needle;
  }
}

/**
 * Escolhe a categoria para um movimento. A primeira regra (por prioridade,
 * depois ordem estável) que casa e cujo tipo coincide com o do movimento
 * vence. Devolve `null` quando nenhuma regra se aplica.
 */
export function categorize(
  input: { description: string | null; kind: EntryKind },
  rules: CategorizationRule[],
): string | null {
  if (!input.description) {
    return null;
  }

  const ordered = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of ordered) {
    if (rule.categoryType === input.kind && matches(input.description, rule)) {
      return rule.categoryId;
    }
  }

  return null;
}
