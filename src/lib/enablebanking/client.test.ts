import { describe, expect, it } from "vitest";

import {
  providerAmountToMinorUnits,
  resolveTransactionExternalId,
} from "./client";

const base = {
  transaction_amount: { currency: "EUR", amount: "3.20" },
  credit_debit_indicator: "DBIT" as const,
  booking_date: "2026-07-18",
  remittance_information: ["CAFE CENTRAL"],
};

describe("providerAmountToMinorUnits", () => {
  it("converte decimais do fornecedor sem vírgula flutuante", () => {
    expect(providerAmountToMinorUnits("3.20")).toBe(320);
    expect(providerAmountToMinorUnits("-12.5")).toBe(-1250);
    expect(providerAmountToMinorUnits("1000")).toBe(100000);
  });
});

describe("resolveTransactionExternalId", () => {
  it("usa o entry_reference do banco quando existe", () => {
    expect(
      resolveTransactionExternalId({ ...base, entry_reference: "ABC123" }),
    ).toBe("ABC123");
  });

  it("sintetiza um id estável quando falta identificador", () => {
    const id1 = resolveTransactionExternalId({ ...base });
    const id2 = resolveTransactionExternalId({ ...base });
    expect(id1).toMatch(/^syn:[0-9a-f]{40}$/);
    expect(id1).toBe(id2); // determinístico
  });

  it("gera ids diferentes para movimentos diferentes", () => {
    const id1 = resolveTransactionExternalId({ ...base });
    const id2 = resolveTransactionExternalId({
      ...base,
      transaction_amount: { currency: "EUR", amount: "9.90" },
    });
    expect(id1).not.toBe(id2);
  });

  it("trata entry_reference vazio como ausente", () => {
    expect(
      resolveTransactionExternalId({ ...base, entry_reference: "  " }),
    ).toMatch(/^syn:/);
  });
});
