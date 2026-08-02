/**
 * Emoji representativo de uma categoria, deduzido do nome (sem configuração
 * do utilizador). Torna as categorias reconhecíveis num relance nas listas.
 */

const RULES: { keywords: string[]; emoji: string }[] = [
  { keywords: ["supermerc", "mercado", "mercear"], emoji: "🛒" },
  { keywords: ["restaur", "café", "cafe", "comida", "refei"], emoji: "🍽️" },
  { keywords: ["saúde", "saude", "farm", "médic", "medic"], emoji: "💊" },
  { keywords: ["transp", "combust", "carro", "viagem", "gasolina"], emoji: "🚗" },
  { keywords: ["lazer", "divers", "cinema", "jogo"], emoji: "🎉" },
  { keywords: ["subscri", "streaming"], emoji: "🔁" },
  { keywords: ["compra", "vestu", "roupa"], emoji: "🛍️" },
  { keywords: ["casa", "renda", "habita", "água", "agua", "luz", "eletri"], emoji: "🏠" },
  { keywords: ["salário", "salario", "ordenado", "vencimento"], emoji: "💰" },
  { keywords: ["rendiment", "juros", "reembolso"], emoji: "💶" },
  { keywords: ["educa", "escola", "propina", "livro"], emoji: "📚" },
  { keywords: ["viagens", "férias", "ferias", "hotel", "voo"], emoji: "✈️" },
  { keywords: ["ginás", "ginas", "desporto", "fitness"], emoji: "🏋️" },
  { keywords: ["presente", "oferta"], emoji: "🎁" },
  { keywords: ["poupan", "investi"], emoji: "🐷" },
];

/** Devolve o emoji da categoria pelo nome, ou uma etiqueta genérica. */
export function categoryEmoji(name: string | null | undefined): string {
  if (!name) {
    return "🏷️";
  }
  const lower = name.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return rule.emoji;
    }
  }
  return "🏷️";
}
