import type { EntryKind } from "./rules";

/**
 * Regras sugeridas para comerciantes e operações comuns em Portugal (D-011).
 * Mapeiam padrões de descrição para categorias predefinidas (D-008). A ordem
 * importa: padrões mais específicos vêm primeiro (ex.: "uber eats" antes de
 * "uber"), ficando com maior prioridade.
 */
export interface SuggestedRule {
  pattern: string;
  categoryName: string;
  categoryType: EntryKind;
}

export const SUGGESTED_RULES: SuggestedRule[] = [
  // Supermercado
  { pattern: "continente", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "pingo doce", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "lidl", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "intermarche", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "minipreco", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "auchan", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "jumbo", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "mercadona", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "espaco fresco", categoryName: "Supermercado", categoryType: "expense" },
  { pattern: "delimarket", categoryName: "Supermercado", categoryType: "expense" },
  // Restaurantes e cafés (específicos primeiro)
  { pattern: "uber eats", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "bolt food", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "mcdonald", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "burger king", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "kfc", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "glovo", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "starbucks", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "telepizza", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  { pattern: "dona onca", categoryName: "Restaurantes e cafés", categoryType: "expense" },
  // Transportes (específicos primeiro)
  { pattern: "via verde", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "combustiveis", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "galp", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "repsol", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "cepsa", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "prio", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "comboios", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "carris", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "metropolitano", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "bolt", categoryName: "Transportes", categoryType: "expense" },
  { pattern: "uber", categoryName: "Transportes", categoryType: "expense" },
  // Saúde
  { pattern: "farmacia", categoryName: "Saúde", categoryType: "expense" },
  { pattern: "pharma", categoryName: "Saúde", categoryType: "expense" },
  { pattern: "clinica", categoryName: "Saúde", categoryType: "expense" },
  { pattern: "hospital", categoryName: "Saúde", categoryType: "expense" },
  // Subscrições
  { pattern: "netflix", categoryName: "Subscrições", categoryType: "expense" },
  { pattern: "spotify", categoryName: "Subscrições", categoryType: "expense" },
  { pattern: "disney", categoryName: "Subscrições", categoryType: "expense" },
  { pattern: "hbo", categoryName: "Subscrições", categoryType: "expense" },
  { pattern: "amazon prime", categoryName: "Subscrições", categoryType: "expense" },
  { pattern: "anthropic", categoryName: "Subscrições", categoryType: "expense" },
  { pattern: "claude", categoryName: "Subscrições", categoryType: "expense" },
  { pattern: "openai", categoryName: "Subscrições", categoryType: "expense" },
  // Compras (após "amazon prime")
  { pattern: "amazon", categoryName: "Compras", categoryType: "expense" },
  { pattern: "worten", categoryName: "Compras", categoryType: "expense" },
  { pattern: "fnac", categoryName: "Compras", categoryType: "expense" },
  { pattern: "primark", categoryName: "Compras", categoryType: "expense" },
  { pattern: "zara", categoryName: "Compras", categoryType: "expense" },
  // Lazer
  { pattern: "casino", categoryName: "Lazer", categoryType: "expense" },
  { pattern: "cinema", categoryName: "Lazer", categoryType: "expense" },
  { pattern: "nos cinemas", categoryName: "Lazer", categoryType: "expense" },
  // Rendimentos
  { pattern: "salario", categoryName: "Salário", categoryType: "income" },
  { pattern: "ordenado", categoryName: "Salário", categoryType: "income" },
  { pattern: "vencimento", categoryName: "Salário", categoryType: "income" },
];
