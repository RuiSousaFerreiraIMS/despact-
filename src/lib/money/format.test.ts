import { describe, expect, it } from "vitest";

import {
  formatMinorUnits,
  minorUnitsToInputValue,
  parseAmountToMinorUnits,
} from "./format";

// A formatação Intl usa espaços especiais (NBSP/narrow NBSP); normalizamos
// para comparar de forma estável entre versões do ICU.
function normalize(value: string): string {
  return value.replace(/[  ]/g, " ");
}

describe("parseAmountToMinorUnits", () => {
  it("converte inteiros e decimais com vírgula ou ponto", () => {
    expect(parseAmountToMinorUnits("1234")).toBe(123400);
    expect(parseAmountToMinorUnits("1234,56")).toBe(123456);
    expect(parseAmountToMinorUnits("1234.56")).toBe(123456);
  });

  it("aceita valores negativos e espaços de milhares", () => {
    expect(parseAmountToMinorUnits("-250")).toBe(-25000);
    expect(parseAmountToMinorUnits("1 234,56")).toBe(123456);
  });

  it("completa décimas para cêntimos", () => {
    expect(parseAmountToMinorUnits("12,5")).toBe(1250);
  });

  it("rejeita entradas inválidas", () => {
    expect(parseAmountToMinorUnits("")).toBeNull();
    expect(parseAmountToMinorUnits("abc")).toBeNull();
    expect(parseAmountToMinorUnits("12,345")).toBeNull();
    expect(parseAmountToMinorUnits("1.234,56")).toBeNull();
  });
});

describe("formatMinorUnits", () => {
  it("formata cêntimos como euros em pt-PT", () => {
    // Nota CLDR pt-PT: o separador de milhares só entra a partir de 5 dígitos.
    expect(normalize(formatMinorUnits(123456, "EUR"))).toBe("1234,56 €");
    expect(normalize(formatMinorUnits(1234567, "EUR"))).toBe("12 345,67 €");
    expect(normalize(formatMinorUnits(-25000, "EUR"))).toBe("-250,00 €");
  });
});

describe("minorUnitsToInputValue", () => {
  it("converte cêntimos em texto editável", () => {
    expect(minorUnitsToInputValue(123456)).toBe("1234,56");
    expect(minorUnitsToInputValue(-25000)).toBe("-250,00");
    expect(minorUnitsToInputValue(5)).toBe("0,05");
  });
});
