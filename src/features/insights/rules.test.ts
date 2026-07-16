import { describe, expect, it } from "vitest";

import {
  coverageInsight,
  expenseComparisonInsight,
  goalsVsSavingsInsight,
  savingsRateInsight,
  topCategoryInsight,
} from "./rules";

describe("savingsRateInsight", () => {
  it("é nulo sem receitas", () => {
    expect(
      savingsRateInsight({
        incomeMinor: 0,
        expenseMinor: -1000,
        monthLabel: "Julho 2026",
      }),
    ).toBeNull();
  });

  it("calcula a taxa de poupança", () => {
    const insight = savingsRateInsight({
      incomeMinor: 200000,
      expenseMinor: -150000,
      monthLabel: "Julho 2026",
    });
    expect(insight?.body).toContain("25%");
    expect(insight?.tone).toBe("positive");
    expect(insight?.explanation).toContain("Julho 2026");
  });

  it("avisa quando as despesas superam as receitas", () => {
    const insight = savingsRateInsight({
      incomeMinor: 100000,
      expenseMinor: -120000,
      monthLabel: "Julho 2026",
    });
    expect(insight?.tone).toBe("warning");
    expect(insight?.body).toContain("superaram");
  });
});

describe("expenseComparisonInsight", () => {
  const base = {
    day: 15,
    monthLabel: "Julho 2026",
    previousMonthLabel: "Junho 2026",
  };

  it("é nulo sem despesas no período anterior", () => {
    expect(
      expenseComparisonInsight({
        ...base,
        currentExpenseMinor: -5000,
        previousExpenseMinor: 0,
      }),
    ).toBeNull();
  });

  it("detecta aumento com tom de aviso", () => {
    const insight = expenseComparisonInsight({
      ...base,
      currentExpenseMinor: -13000,
      previousExpenseMinor: -10000,
    });
    expect(insight?.body).toContain("30% mais");
    expect(insight?.tone).toBe("warning");
  });

  it("detecta redução com tom positivo", () => {
    const insight = expenseComparisonInsight({
      ...base,
      currentExpenseMinor: -8000,
      previousExpenseMinor: -10000,
    });
    expect(insight?.body).toContain("20% menos");
    expect(insight?.tone).toBe("positive");
  });

  it("trata variações pequenas como estabilidade", () => {
    const insight = expenseComparisonInsight({
      ...base,
      currentExpenseMinor: -10200,
      previousExpenseMinor: -10000,
    });
    expect(insight?.body).toContain("em linha");
    expect(insight?.tone).toBe("neutral");
  });
});

describe("topCategoryInsight", () => {
  it("é nulo sem despesas", () => {
    expect(
      topCategoryInsight({ categories: [], monthLabel: "Julho 2026" }),
    ).toBeNull();
  });

  it("identifica a maior categoria e o seu peso", () => {
    const insight = topCategoryInsight({
      categories: [
        { name: "Supermercado", spentMinor: 30000 },
        { name: "Transportes", spentMinor: 10000 },
      ],
      monthLabel: "Julho 2026",
    });
    expect(insight?.body).toContain("Supermercado");
    expect(insight?.body).toContain("75%");
  });
});

describe("goalsVsSavingsInsight", () => {
  it("é nulo sem objectivos com ritmo", () => {
    expect(
      goalsVsSavingsInsight({
        requiredPerMonthMinor: 0,
        goalsCount: 0,
        averageMonthlySavingsMinor: 50000,
        windowLabel: "3 meses",
      }),
    ).toBeNull();
  });

  it("mostra apenas o ritmo quando não há histórico de poupança", () => {
    const insight = goalsVsSavingsInsight({
      requiredPerMonthMinor: 30000,
      goalsCount: 2,
      averageMonthlySavingsMinor: null,
      windowLabel: "0 meses",
    });
    expect(insight?.tone).toBe("neutral");
    expect(insight?.body).toContain("2 objectivos");
  });

  it("é positivo quando a poupança cobre o ritmo", () => {
    const insight = goalsVsSavingsInsight({
      requiredPerMonthMinor: 30000,
      goalsCount: 1,
      averageMonthlySavingsMinor: 50000,
      windowLabel: "3 meses",
    });
    expect(insight?.tone).toBe("positive");
    expect(insight?.body).toContain("cobre");
  });

  it("avisa quando a poupança não chega, com concordância singular", () => {
    const insight = goalsVsSavingsInsight({
      requiredPerMonthMinor: 60000,
      goalsCount: 1,
      averageMonthlySavingsMinor: 20000,
      windowLabel: "3 meses",
    });
    expect(insight?.tone).toBe("warning");
    expect(insight?.body).toContain("O seu objectivo com data-alvo exige");
    expect(insight?.body).toContain("Reforce a poupança ou ajuste");
  });
});

describe("coverageInsight", () => {
  it("é nulo sem média de despesas ou património positivo", () => {
    expect(
      coverageInsight({
        netWorthMinor: 100000,
        averageMonthlyExpenseMinor: 0,
        windowLabel: "3 meses",
      }),
    ).toBeNull();
    expect(
      coverageInsight({
        netWorthMinor: -5000,
        averageMonthlyExpenseMinor: 10000,
        windowLabel: "3 meses",
      }),
    ).toBeNull();
  });

  it("calcula meses de cobertura com uma casa decimal", () => {
    const insight = coverageInsight({
      netWorthMinor: 1000000,
      averageMonthlyExpenseMinor: 150000,
      windowLabel: "3 meses",
    });
    expect(insight?.body).toContain("6,6 meses");
    expect(insight?.tone).toBe("positive");
  });

  it("avisa quando a cobertura é inferior a 2 meses", () => {
    const insight = coverageInsight({
      netWorthMinor: 150000,
      averageMonthlyExpenseMinor: 100000,
      windowLabel: "3 meses",
    });
    expect(insight?.tone).toBe("warning");
  });
});
