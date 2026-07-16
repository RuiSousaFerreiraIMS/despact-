import { describe, expect, it } from "vitest";

import { goalPace } from "./pace";

const today = new Date(2026, 6, 16); // 16 de Julho de 2026

describe("goalPace", () => {
  it("é nulo sem data-alvo", () => {
    expect(
      goalPace({
        targetAmountMinor: 100000,
        currentAmountMinor: 0,
        targetDate: null,
        today,
      }),
    ).toBeNull();
  });

  it("é nulo quando o objectivo já foi atingido", () => {
    expect(
      goalPace({
        targetAmountMinor: 100000,
        currentAmountMinor: 100000,
        targetDate: "2026-12-31",
        today,
      }),
    ).toBeNull();
  });

  it("calcula o valor mensal necessário", () => {
    const pace = goalPace({
      targetAmountMinor: 1000000,
      currentAmountMinor: 400000,
      targetDate: "2026-12-31",
      today,
    });
    // Julho→Dezembro: 6 meses; 6000 € / 6 = 1000 €/mês.
    expect(pace?.monthsLeft).toBe(6);
    expect(pace?.perMonthMinor).toBe(100000);
    expect(pace?.overdue).toBe(false);
  });

  it("usa pelo menos um mês quando a data está próxima", () => {
    const pace = goalPace({
      targetAmountMinor: 50000,
      currentAmountMinor: 0,
      targetDate: "2026-07-20",
      today,
    });
    expect(pace?.monthsLeft).toBe(1);
    expect(pace?.perMonthMinor).toBe(50000);
  });

  it("assinala datas-alvo já ultrapassadas", () => {
    const pace = goalPace({
      targetAmountMinor: 50000,
      currentAmountMinor: 10000,
      targetDate: "2026-06-01",
      today,
    });
    expect(pace?.overdue).toBe(true);
    expect(pace?.remainingMinor).toBe(40000);
  });
});
