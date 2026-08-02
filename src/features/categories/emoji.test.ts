import { describe, expect, it } from "vitest";

import { categoryEmoji } from "./emoji";

describe("categoryEmoji", () => {
  it("mapeia categorias comuns pelo nome", () => {
    expect(categoryEmoji("Supermercado")).toBe("🛒");
    expect(categoryEmoji("Restaurantes e cafés")).toBe("🍽️");
    expect(categoryEmoji("Saúde")).toBe("💊");
    expect(categoryEmoji("Transportes")).toBe("🚗");
    expect(categoryEmoji("Salário")).toBe("💰");
  });

  it("usa etiqueta genérica para desconhecidas ou vazias", () => {
    expect(categoryEmoji("Qualquer coisa estranha")).toBe("🏷️");
    expect(categoryEmoji(null)).toBe("🏷️");
    expect(categoryEmoji("")).toBe("🏷️");
  });
});
