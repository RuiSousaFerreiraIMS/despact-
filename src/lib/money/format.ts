/**
 * Formatação e conversão de montantes monetários.
 *
 * Dinheiro é sempre um inteiro em unidades mínimas (cêntimos) com código ISO
 * 4217 (D-001). Este módulo apenas converte entre essa representação e texto;
 * não contém regras de negócio.
 *
 * Nota MVP: assume moedas com 2 casas decimais (EUR). Moedas com 0 ou 3 casas
 * exigirão uma tabela de expoentes quando forem suportadas.
 */

const MINOR_UNITS_PER_MAJOR = 100;

/** Símbolo por moeda; o código serve de recurso para moedas não mapeadas. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  BRL: "R$",
};

/**
 * Formata unidades mínimas como moeda em pt-PT (ex.: 123456 → "1 234,56 €").
 * Formata o número e acrescenta o símbolo manualmente, evitando o símbolo
 * genérico "¤" que aparece quando o ambiente não tem os dados de moeda do ICU.
 */
export function formatMinorUnits(
  amountMinor: number,
  currencyCode: string,
): string {
  const number = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / MINOR_UNITS_PER_MAJOR);

  // "XXX" (ISO: moeda desconhecida), vazio ou código inválido → assumir EUR,
  // já que o produto é em euros (D-001). Evita mostrar "XXX" ou "¤".
  const code = (currencyCode ?? "").toUpperCase();
  const effective = /^[A-Z]{3}$/.test(code) && code !== "XXX" ? code : "EUR";
  const symbol = CURRENCY_SYMBOLS[effective] ?? effective;
  return `${number} ${symbol}`;
}

/**
 * Converte texto introduzido pelo utilizador em unidades mínimas, sem passar
 * por vírgula flutuante. Aceita "1234", "1234,56", "1234.56", "-50" e espaços
 * de milhares. Devolve `null` para entradas inválidas.
 */
export function parseAmountToMinorUnits(input: string): number | null {
  const cleaned = input.replace(/[\s ]/g, "");
  const match = cleaned.match(/^(-?)(\d+)(?:[.,](\d{1,2}))?$/);

  if (!match) {
    return null;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const major = Number.parseInt(match[2], 10);
  const minor = match[3] ? Number.parseInt(match[3].padEnd(2, "0"), 10) : 0;
  const total = major * MINOR_UNITS_PER_MAJOR + minor;

  if (!Number.isSafeInteger(total)) {
    return null;
  }

  return sign * total;
}

/** Converte unidades mínimas em texto editável (ex.: -12345 → "-123,45"). */
export function minorUnitsToInputValue(amountMinor: number): string {
  const sign = amountMinor < 0 ? "-" : "";
  const absolute = Math.abs(amountMinor);
  const major = Math.floor(absolute / MINOR_UNITS_PER_MAJOR);
  const minor = absolute % MINOR_UNITS_PER_MAJOR;
  return `${sign}${major},${String(minor).padStart(2, "0")}`;
}
