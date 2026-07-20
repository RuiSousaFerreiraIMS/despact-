/**
 * Importação de extractos CSV (V2 Sprint 6, Unidade B).
 *
 * Funções puras e determinísticas: separar o CSV, interpretar montantes e
 * datas nos formatos comuns dos bancos, e normalizar linhas em movimentos.
 * Sem I/O — testável isoladamente. O servidor revalida antes de inserir.
 */

/** Deteta o separador mais provável a partir da primeira linha não vazia. */
export function detectDelimiter(text: string): "," | ";" | "\t" {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
  const counts: Record<string, number> = {
    ";": (firstLine.match(/;/g) ?? []).length,
    ",": (firstLine.match(/,/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? (best[0] as "," | ";" | "\t") : ",";
}

/**
 * Separa texto CSV em linhas de campos, respeitando aspas duplas (com "" a
 * escapar aspas). Ignora linhas totalmente vazias.
 */
export function parseCsv(
  text: string,
  delimiter: string = detectDelimiter(text),
): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += char;
    }
  }

  // Última linha sem quebra final.
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Converte um montante de extracto em unidades mínimas inteiras, sem vírgula
 * flutuante (D-001). Suporta formato europeu (1.234,56) e americano
 * (1,234.56), sinal negativo à frente/atrás e parênteses para negativos.
 * Devolve `null` para valores inválidos.
 */
export function parseCsvAmount(raw: string): number | null {
  let value = raw.trim();
  if (value === "") {
    return null;
  }

  let negative = false;

  // Parênteses indicam negativo (convenção contabilística).
  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1).trim();
  }
  // Sinal à frente ou atrás.
  if (value.startsWith("-")) {
    negative = true;
    value = value.slice(1);
  } else if (value.endsWith("-")) {
    negative = true;
    value = value.slice(0, -1);
  } else if (value.startsWith("+")) {
    value = value.slice(1);
  }

  // Remover símbolos de moeda e espaços.
  value = value.replace(/[€$£\s ]/g, "");

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  let normalized: string;
  if (lastComma === -1 && lastDot === -1) {
    normalized = value;
  } else if (lastComma > lastDot) {
    // Vírgula é o separador decimal (europeu): pontos são milhares.
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else {
    // Ponto é o separador decimal (americano): vírgulas são milhares.
    normalized = value.replace(/,/g, "");
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const [major, minorRaw = ""] = normalized.split(".");
  const minor = (minorRaw + "00").slice(0, 2);
  const total = Number.parseInt(major, 10) * 100 + Number.parseInt(minor, 10);

  if (!Number.isSafeInteger(total)) {
    return null;
  }

  return negative ? -total : total;
}

/**
 * Interpreta uma data de extracto em ISO (AAAA-MM-DD). Suporta AAAA-MM-DD,
 * DD/MM/AAAA e DD-MM-AAAA (e barras/pontos). Assume dia antes de mês, como é
 * comum em Portugal. Devolve `null` se inválida.
 */
export function parseCsvDate(raw: string): string | null {
  const value = raw.trim();

  const iso = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) {
    return buildDate(iso[1], iso[2], iso[3]);
  }

  const dmy = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return buildDate(year, dmy[2], dmy[1]);
  }

  return null;
}

function buildDate(
  year: string,
  month: string,
  day: string,
): string | null {
  const y = Number.parseInt(year, 10);
  const m = Number.parseInt(month, 10);
  const d = Number.parseInt(day, 10);

  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }

  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  // Rejeita datas impossíveis (ex.: 31/02).
  const check = new Date(`${iso}T00:00:00Z`);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() + 1 !== m ||
    check.getUTCDate() !== d
  ) {
    return null;
  }

  return iso;
}

export interface ColumnMapping {
  hasHeader: boolean;
  dateIndex: number;
  descriptionIndex: number;
  /** Coluna única de montante assinado. */
  amountIndex?: number;
  /** Ou colunas separadas de débito (saída) e crédito (entrada). */
  debitIndex?: number;
  creditIndex?: number;
}

export interface NormalizedRow {
  occurredOn: string;
  amountMinor: number;
  description: string | null;
}

export interface NormalizeResult {
  rows: NormalizedRow[];
  errors: { line: number; message: string }[];
}

/** Normaliza as linhas do CSV em movimentos, coligindo erros por linha. */
export function normalizeRows(
  rows: string[][],
  mapping: ColumnMapping,
): NormalizeResult {
  const body = mapping.hasHeader ? rows.slice(1) : rows;
  const result: NormalizeResult = { rows: [], errors: [] };

  body.forEach((cells, index) => {
    const line = index + (mapping.hasHeader ? 2 : 1);

    const occurredOn = parseCsvDate(cells[mapping.dateIndex] ?? "");
    if (!occurredOn) {
      result.errors.push({ line, message: "Data inválida." });
      return;
    }

    let amountMinor: number | null;
    if (mapping.amountIndex !== undefined) {
      amountMinor = parseCsvAmount(cells[mapping.amountIndex] ?? "");
    } else {
      const debit = parseCsvAmount(cells[mapping.debitIndex ?? -1] ?? "");
      const credit = parseCsvAmount(cells[mapping.creditIndex ?? -1] ?? "");
      if (debit !== null && debit !== 0) {
        amountMinor = -Math.abs(debit);
      } else if (credit !== null && credit !== 0) {
        amountMinor = Math.abs(credit);
      } else {
        amountMinor = null;
      }
    }

    if (amountMinor === null || amountMinor === 0) {
      result.errors.push({ line, message: "Montante inválido ou zero." });
      return;
    }

    const description = (cells[mapping.descriptionIndex] ?? "").trim();

    result.rows.push({
      occurredOn,
      amountMinor,
      description: description === "" ? null : description,
    });
  });

  return result;
}
