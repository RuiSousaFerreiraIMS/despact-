"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { categorize } from "@/features/categorization/rules";
import { loadRulesForEngine } from "@/features/categorization/queries";
import { createClient } from "@/lib/supabase/server";

import type { NormalizedRow } from "./csv";

const MAX_ROWS = 2000;
const BATCH_SIZE = 100;

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user.id;
}

/**
 * Importa movimentos normalizados de um CSV para uma conta. O servidor é a
 * fonte de validação: revalida cada linha, aplica as regras de categorização
 * (D-011) e insere com proveniência `csv`. Sem deduplicação automática — o
 * utilizador confirma na pré-visualização.
 */
export async function importCsvTransactions(
  accountId: string,
  rows: NormalizedRow[],
): Promise<{ ok: true; imported: number } | { ok: false; error: string }> {
  const userId = await requireUserId();

  if (!accountId) {
    return { ok: false, error: "Escolha a conta de destino." };
  }
  if (rows.length === 0) {
    return { ok: false, error: "Não há movimentos válidos para importar." };
  }
  if (rows.length > MAX_ROWS) {
    return {
      ok: false,
      error: `Demasiados movimentos (máximo ${MAX_ROWS}). Divida o ficheiro.`,
    };
  }

  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("currency_code, archived_at")
    .eq("id", accountId)
    .maybeSingle();

  if (!account) {
    return { ok: false, error: "Conta inexistente." };
  }
  if (account.archived_at) {
    return { ok: false, error: "Não é possível importar para uma conta arquivada." };
  }

  const rules = await loadRulesForEngine();

  const prepared = rows
    // Revalidação defensiva: só datas ISO e montantes inteiros não nulos.
    .filter(
      (row) =>
        /^\d{4}-\d{2}-\d{2}$/.test(row.occurredOn) &&
        Number.isSafeInteger(row.amountMinor) &&
        row.amountMinor !== 0,
    )
    .map((row) => {
      const kind = row.amountMinor > 0 ? ("income" as const) : ("expense" as const);
      return {
        user_id: userId,
        account_id: accountId,
        kind,
        amount_minor: row.amountMinor,
        currency_code: account.currency_code,
        occurred_on: row.occurredOn,
        description: row.description,
        category_id: categorize({ description: row.description, kind }, rules),
        source: "csv" as const,
      };
    });

  if (prepared.length === 0) {
    return { ok: false, error: "Não há movimentos válidos para importar." };
  }

  let imported = 0;
  for (let i = 0; i < prepared.length; i += BATCH_SIZE) {
    const batch = prepared.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("transactions").insert(batch);
    if (error) {
      return {
        ok: false,
        error: "Não foi possível importar. Verifique a moeda da conta e os dados.",
      };
    }
    imported += batch.length;
  }

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  return { ok: true, imported };
}
