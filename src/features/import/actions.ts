"use server";

import { createHash } from "node:crypto";

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
 * Identificador estável de uma linha de CSV, por conta, para deduplicação.
 * Reimportar o mesmo extracto (ou extractos que se sobrepõem) não cria
 * repetidos. Inclui a conta para não colidir entre contas.
 *
 * Limite conhecido: dois movimentos idênticos no mesmo dia (mesma data,
 * montante e descrição) colapsam num só — raro e preferível a duplicar em
 * cada importação.
 */
function csvExternalId(
  accountId: string,
  row: NormalizedRow,
): string {
  const seed = [
    accountId,
    row.occurredOn,
    row.amountMinor,
    row.description ?? "",
  ].join("|");
  return `csv:${createHash("sha1").update(seed).digest("hex")}`;
}

/**
 * Importa movimentos normalizados de um CSV para uma conta. O servidor
 * revalida cada linha, aplica as regras de categorização (D-011), deduplica
 * por identificador estável e insere com proveniência `csv`. Idempotente:
 * reimportar traz apenas movimentos novos.
 */
export async function importCsvTransactions(
  accountId: string,
  rows: NormalizedRow[],
): Promise<
  | { ok: true; imported: number; skipped: number }
  | { ok: false; error: string }
> {
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
    return {
      ok: false,
      error: "Não é possível importar para uma conta arquivada.",
    };
  }

  const rules = await loadRulesForEngine();

  // Revalidação defensiva + identificador estável por linha.
  const candidates = rows
    .filter(
      (row) =>
        /^\d{4}-\d{2}-\d{2}$/.test(row.occurredOn) &&
        Number.isSafeInteger(row.amountMinor) &&
        row.amountMinor !== 0,
    )
    .map((row) => ({ row, externalId: csvExternalId(accountId, row) }));

  if (candidates.length === 0) {
    return { ok: false, error: "Não há movimentos válidos para importar." };
  }

  // Deduplicar dentro do próprio ficheiro (mesmo id repetido).
  const seenInFile = new Set<string>();
  const unique = candidates.filter(({ externalId }) => {
    if (seenInFile.has(externalId)) {
      return false;
    }
    seenInFile.add(externalId);
    return true;
  });

  // Quais já existem na base de dados (deste utilizador)?
  const known = new Set<string>();
  const allIds = unique.map((c) => c.externalId);
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("external_id")
      .in("external_id", allIds.slice(i, i + BATCH_SIZE));
    if (error) {
      return {
        ok: false,
        error: "Não foi possível verificar movimentos existentes.",
      };
    }
    for (const t of data) {
      if (t.external_id) {
        known.add(t.external_id);
      }
    }
  }

  const fresh = unique.filter(({ externalId }) => !known.has(externalId));
  const skipped = candidates.length - fresh.length;

  if (fresh.length === 0) {
    return { ok: true, imported: 0, skipped };
  }

  const prepared = fresh.map(({ row, externalId }) => {
    const kind =
      row.amountMinor > 0 ? ("income" as const) : ("expense" as const);
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
      external_id: externalId,
    };
  });

  let imported = 0;
  for (let i = 0; i < prepared.length; i += BATCH_SIZE) {
    const batch = prepared.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("transactions").insert(batch);
    if (error) {
      return {
        ok: false,
        error:
          "Não foi possível importar. Verifique a moeda da conta e os dados.",
      };
    }
    imported += batch.length;
  }

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  return { ok: true, imported, skipped };
}
