import { describe, expect, it } from "vitest";

import { providerAmountToMinorUnits } from "./client";

describe("providerAmountToMinorUnits", () => {
  it("converte decimais do fornecedor em unidades mínimas", () => {
    expect(providerAmountToMinorUnits("12.34")).toBe(1234);
    expect(providerAmountToMinorUnits("-12.34")).toBe(-1234);
    expect(providerAmountToMinorUnits("1500")).toBe(150000);
    expect(providerAmountToMinorUnits("-0.05")).toBe(-5);
  });

  it("completa décimas para cêntimos", () => {
    expect(providerAmountToMinorUnits("12.5")).toBe(1250);
  });

  it("rejeita formatos inesperados", () => {
    expect(providerAmountToMinorUnits("")).toBeNull();
    expect(providerAmountToMinorUnits("12,34")).toBeNull();
    expect(providerAmountToMinorUnits("1.234.56")).toBeNull();
    expect(providerAmountToMinorUnits("12.345")).toBeNull();
    expect(providerAmountToMinorUnits("abc")).toBeNull();
  });
});
