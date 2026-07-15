import { parseAmountToMinorUnits } from "@/lib/money/format";
import type { Database } from "@/types/database";

export type AccountType = Database["public"]["Enums"]["account_type"];

export const ACCOUNT_TYPES: readonly AccountType[] = [
  "cash",
  "current",
  "savings",
  "credit_card",
  "loan",
] as const;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Dinheiro",
  current: "Conta à ordem",
  savings: "Poupança",
  credit_card: "Cartão de crédito",
  loan: "Empréstimo",
};

export interface AccountInput {
  name: string;
  type: AccountType;
  currencyCode: string;
  openingBalanceMinor: number;
}

/**
 * Validação efectiva (no servidor) dos dados de uma conta.
 * Devolve os dados normalizados ou uma mensagem de erro para o utilizador.
 */
export function parseAccountForm(
  formData: FormData,
): { ok: true; value: AccountInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const currencyCode = String(formData.get("currency_code") ?? "")
    .trim()
    .toUpperCase();
  const openingBalanceRaw = String(
    formData.get("opening_balance") ?? "",
  ).trim();

  if (!name) {
    return { ok: false, error: "O nome da conta é obrigatório." };
  }

  if (!ACCOUNT_TYPES.includes(type as AccountType)) {
    return { ok: false, error: "Escolha um tipo de conta válido." };
  }

  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    return {
      ok: false,
      error: "A moeda deve ser um código ISO 4217 de 3 letras (ex.: EUR).",
    };
  }

  const openingBalanceMinor =
    openingBalanceRaw === "" ? 0 : parseAmountToMinorUnits(openingBalanceRaw);

  if (openingBalanceMinor === null) {
    return {
      ok: false,
      error: "Saldo inicial inválido. Use um número como 1234,56 ou -250.",
    };
  }

  return {
    ok: true,
    value: {
      name,
      type: type as AccountType,
      currencyCode,
      openingBalanceMinor,
    },
  };
}
