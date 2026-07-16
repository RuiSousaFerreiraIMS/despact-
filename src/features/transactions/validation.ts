import { parseAmountToMinorUnits } from "@/lib/money/format";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type EntryKind = "income" | "expense";

export interface TransactionInput {
  kind: EntryKind;
  accountId: string;
  /** Assinado segundo D-003: positivo para receita, negativo para despesa. */
  amountMinor: number;
  occurredOn: string;
  description: string | null;
  categoryId: string | null;
  /** Nome de categoria a criar no acto do registo (opção "+ Nova categoria"). */
  newCategoryName: string | null;
}

/** Valor sentinela do select quando o utilizador quer criar uma categoria. */
export const NEW_CATEGORY_VALUE = "__new__";

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  /** Sempre positivo; a função create_transfer aplica os sinais. */
  amountMinor: number;
  occurredOn: string;
  description: string | null;
}

/**
 * Validação efectiva (no servidor) de uma receita/despesa. O utilizador
 * introduz sempre um valor positivo; o sinal deriva do tipo (D-003).
 */
export function parseTransactionForm(
  formData: FormData,
): { ok: true; value: TransactionInput } | { ok: false; error: string } {
  const kind = String(formData.get("kind") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");

  if (kind !== "income" && kind !== "expense") {
    return { ok: false, error: "Escolha receita ou despesa." };
  }

  if (!UUID_PATTERN.test(accountId)) {
    return { ok: false, error: "Escolha uma conta." };
  }

  const amountMinor = parseAmountToMinorUnits(amountRaw);

  if (amountMinor === null || amountMinor <= 0) {
    return {
      ok: false,
      error: "Montante inválido. Use um valor positivo como 12,50.",
    };
  }

  if (!DATE_PATTERN.test(occurredOn)) {
    return { ok: false, error: "Indique a data do movimento." };
  }

  const newCategoryName = String(
    formData.get("new_category_name") ?? "",
  ).trim();

  if (categoryId === NEW_CATEGORY_VALUE) {
    if (!newCategoryName) {
      return { ok: false, error: "Indique o nome da nova categoria." };
    }
  } else if (categoryId !== "" && !UUID_PATTERN.test(categoryId)) {
    return { ok: false, error: "Categoria inválida." };
  }

  return {
    ok: true,
    value: {
      kind,
      accountId,
      amountMinor: kind === "expense" ? -amountMinor : amountMinor,
      occurredOn,
      description: description === "" ? null : description,
      categoryId:
        categoryId === "" || categoryId === NEW_CATEGORY_VALUE
          ? null
          : categoryId,
      newCategoryName:
        categoryId === NEW_CATEGORY_VALUE ? newCategoryName : null,
    },
  };
}

/** Validação efectiva (no servidor) de uma transferência entre contas. */
export function parseTransferForm(
  formData: FormData,
): { ok: true; value: TransferInput } | { ok: false; error: string } {
  const fromAccountId = String(formData.get("from_account_id") ?? "");
  const toAccountId = String(formData.get("to_account_id") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!UUID_PATTERN.test(fromAccountId) || !UUID_PATTERN.test(toAccountId)) {
    return { ok: false, error: "Escolha as contas de origem e destino." };
  }

  if (fromAccountId === toAccountId) {
    return {
      ok: false,
      error: "A conta de origem e a de destino têm de ser diferentes.",
    };
  }

  const amountMinor = parseAmountToMinorUnits(amountRaw);

  if (amountMinor === null || amountMinor <= 0) {
    return {
      ok: false,
      error: "Montante inválido. Use um valor positivo como 12,50.",
    };
  }

  if (!DATE_PATTERN.test(occurredOn)) {
    return { ok: false, error: "Indique a data da transferência." };
  }

  return {
    ok: true,
    value: {
      fromAccountId,
      toAccountId,
      amountMinor,
      occurredOn,
      description: description === "" ? null : description,
    },
  };
}
