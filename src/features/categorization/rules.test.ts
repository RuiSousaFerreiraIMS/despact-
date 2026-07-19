import { describe, expect, it } from "vitest";

import { categorize } from "./rules";
import type { CategorizationRule } from "./rules";

const rules: CategorizationRule[] = [
  {
    id: "r1",
    pattern: "continente",
    matchType: "contains",
    categoryId: "cat-super",
    categoryType: "expense",
    priority: 0,
  },
  {
    id: "r2",
    pattern: "salário",
    matchType: "contains",
    categoryId: "cat-salario",
    categoryType: "income",
    priority: 0,
  },
  {
    id: "r3",
    pattern: "trf",
    matchType: "starts_with",
    categoryId: "cat-transf",
    categoryType: "expense",
    priority: 10,
  },
];

describe("categorize", () => {
  it("é nulo sem descrição", () => {
    expect(categorize({ description: null, kind: "expense" }, rules)).toBeNull();
  });

  it("casa por 'contains' sem distinguir acentos nem maiúsculas", () => {
    expect(
      categorize(
        { description: "COMPRA CONTINENTE LISBOA", kind: "expense" },
        rules,
      ),
    ).toBe("cat-super");
    expect(
      categorize({ description: "salario julho", kind: "income" }, rules),
    ).toBe("cat-salario");
  });

  it("respeita o tipo do movimento", () => {
    // "salário" é regra de receita; não deve aplicar-se a uma despesa.
    expect(
      categorize({ description: "estorno salário", kind: "expense" }, rules),
    ).toBeNull();
  });

  it("usa a prioridade: menor valor vence", () => {
    const conflicting: CategorizationRule[] = [
      { ...rules[0], id: "a", pattern: "loja", priority: 5, categoryId: "A" },
      { ...rules[0], id: "b", pattern: "loja", priority: 1, categoryId: "B" },
    ];
    expect(
      categorize({ description: "LOJA X", kind: "expense" }, conflicting),
    ).toBe("B");
  });

  it("suporta 'starts_with' e 'equals'", () => {
    expect(
      categorize({ description: "TRF para João", kind: "expense" }, rules),
    ).toBe("cat-transf");
    expect(
      categorize({ description: "no meio TRF", kind: "expense" }, rules),
    ).toBeNull();

    const exact: CategorizationRule[] = [
      {
        id: "e",
        pattern: "renda",
        matchType: "equals",
        categoryId: "cat-renda",
        categoryType: "expense",
        priority: 0,
      },
    ];
    expect(
      categorize({ description: "Renda", kind: "expense" }, exact),
    ).toBe("cat-renda");
    expect(
      categorize({ description: "Renda casa", kind: "expense" }, exact),
    ).toBeNull();
  });

  it("devolve null quando nada casa", () => {
    expect(
      categorize({ description: "algo aleatório", kind: "expense" }, rules),
    ).toBeNull();
  });
});
