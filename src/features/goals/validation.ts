import { parseAmountToMinorUnits } from "@/lib/money/format";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface GoalInput {
  name: string;
  targetAmountMinor: number;
  currencyCode: string;
  targetDate: string | null;
}

/** Validação efectiva (no servidor) dos dados de um objectivo. */
export function parseGoalForm(
  formData: FormData,
): { ok: true; value: GoalInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const targetRaw = String(formData.get("target_amount") ?? "").trim();
  const currencyCode = String(formData.get("currency_code") ?? "EUR")
    .trim()
    .toUpperCase();
  const targetDate = String(formData.get("target_date") ?? "").trim();

  if (!name) {
    return { ok: false, error: "O nome do objectivo é obrigatório." };
  }

  const targetAmountMinor = parseAmountToMinorUnits(targetRaw);

  if (targetAmountMinor === null || targetAmountMinor <= 0) {
    return {
      ok: false,
      error: "Montante-alvo inválido. Use um valor positivo como 5000.",
    };
  }

  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    return {
      ok: false,
      error: "A moeda deve ser um código ISO 4217 de 3 letras (ex.: EUR).",
    };
  }

  if (targetDate !== "" && !DATE_PATTERN.test(targetDate)) {
    return { ok: false, error: "Data-alvo inválida." };
  }

  return {
    ok: true,
    value: {
      name,
      targetAmountMinor,
      currencyCode,
      targetDate: targetDate === "" ? null : targetDate,
    },
  };
}

/** Validação da actualização manual de progresso (D-006): valor >= 0. */
export function parseProgressForm(
  formData: FormData,
): { ok: true; value: { currentAmountMinor: number } } | { ok: false; error: string } {
  const raw = String(formData.get("current_amount") ?? "").trim();
  const currentAmountMinor = parseAmountToMinorUnits(raw);

  if (currentAmountMinor === null || currentAmountMinor < 0) {
    return {
      ok: false,
      error: "Progresso inválido. Use um valor não negativo como 1250,50.",
    };
  }

  return { ok: true, value: { currentAmountMinor } };
}
