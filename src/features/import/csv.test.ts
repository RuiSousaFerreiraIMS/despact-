import { describe, expect, it } from "vitest";

import {
  detectDelimiter,
  normalizeRows,
  parseCsv,
  parseCsvAmount,
  parseCsvDate,
} from "./csv";

describe("detectDelimiter", () => {
  it("deteta ponto e vírgula, vírgula e tab", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a,b,c")).toBe(",");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
  });
});

describe("parseCsv", () => {
  it("separa campos e linhas", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("respeita aspas com separador e aspas escapadas", () => {
    expect(parseCsv('"a,b",c\n"diz ""olá""",2')).toEqual([
      ["a,b", "c"],
      ['diz "olá"', "2"],
    ]);
  });

  it("ignora linhas vazias e lida com CRLF", () => {
    expect(parseCsv("a;b\r\n\r\n1;2\r\n", ";")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseCsvAmount", () => {
  it("formato europeu", () => {
    expect(parseCsvAmount("1.234,56")).toBe(123456);
    expect(parseCsvAmount("-12,50")).toBe(-1250);
    expect(parseCsvAmount("0,99")).toBe(99);
  });

  it("formato americano", () => {
    expect(parseCsvAmount("1,234.56")).toBe(123456);
    expect(parseCsvAmount("12.5")).toBe(1250);
  });

  it("sinais e parênteses", () => {
    expect(parseCsvAmount("(50,00)")).toBe(-5000);
    expect(parseCsvAmount("50,00-")).toBe(-5000);
    expect(parseCsvAmount("+50")).toBe(5000);
  });

  it("símbolos de moeda e espaços", () => {
    expect(parseCsvAmount("1 234,56 €")).toBe(123456);
    expect(parseCsvAmount("€ 10")).toBe(1000);
  });

  it("rejeita inválidos", () => {
    expect(parseCsvAmount("")).toBeNull();
    expect(parseCsvAmount("abc")).toBeNull();
    expect(parseCsvAmount("1,2,3,4")).toBeNull();
  });
});

describe("parseCsvDate", () => {
  it("aceita formatos comuns, assumindo dia-mês", () => {
    expect(parseCsvDate("2026-07-18")).toBe("2026-07-18");
    expect(parseCsvDate("18/07/2026")).toBe("2026-07-18");
    expect(parseCsvDate("18-07-2026")).toBe("2026-07-18");
    expect(parseCsvDate("05/03/26")).toBe("2026-03-05");
  });

  it("rejeita datas impossíveis e lixo", () => {
    expect(parseCsvDate("31/02/2026")).toBeNull();
    expect(parseCsvDate("2026-13-01")).toBeNull();
    expect(parseCsvDate("ontem")).toBeNull();
  });
});

describe("normalizeRows", () => {
  it("coluna única de montante assinado, com cabeçalho", () => {
    const rows = [
      ["Data", "Descrição", "Montante"],
      ["18/07/2026", "Continente", "-34,50"],
      ["01/07/2026", "Salário", "1500,00"],
    ];
    const result = normalizeRows(rows, {
      hasHeader: true,
      dateIndex: 0,
      descriptionIndex: 1,
      amountIndex: 2,
    });
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { occurredOn: "2026-07-18", amountMinor: -3450, description: "Continente" },
      { occurredOn: "2026-07-01", amountMinor: 150000, description: "Salário" },
    ]);
  });

  it("colunas separadas de débito e crédito", () => {
    const rows = [
      ["18/07/2026", "Compra", "34,50", ""],
      ["01/07/2026", "Ordenado", "", "1500,00"],
    ];
    const result = normalizeRows(rows, {
      hasHeader: false,
      dateIndex: 0,
      descriptionIndex: 1,
      debitIndex: 2,
      creditIndex: 3,
    });
    expect(result.rows.map((r) => r.amountMinor)).toEqual([-3450, 150000]);
  });

  it("regista erros por linha sem interromper as válidas", () => {
    const rows = [
      ["data-marota", "X", "10,00"],
      ["18/07/2026", "Ok", "10,00"],
      ["19/07/2026", "Zero", "0,00"],
    ];
    const result = normalizeRows(rows, {
      hasHeader: false,
      dateIndex: 0,
      descriptionIndex: 1,
      amountIndex: 2,
    });
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toEqual([
      { line: 1, message: "Data inválida." },
      { line: 3, message: "Montante inválido ou zero." },
    ]);
  });
});
