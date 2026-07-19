import { categorize } from "@/features/categorization/rules";
import { loadRulesForEngine } from "@/features/categorization/queries";
import { getBookedTransactions } from "@/lib/enablebanking/client";
import type { ExternalTransaction } from "@/lib/enablebanking/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Importação de movimentos bancários (D-009).
 *
 * Idempotente por construção: o índice único (user_id, external_id) garante
 * que repetir nunca duplica; aqui pré-filtramos os já conhecidos para
 * inserir apenas novos. Movimentos noutra moeda que não a da conta são
 * ignorados de forma determinística (o trigger recusá-los-ia).
 */

const BATCH_SIZE = 100;

export interface ImportResult {
  imported: number;
  skipped: number;
  /** Soma assinada dos movimentos importados nesta chamada. */
  importedSumMinor: number;
}

export async function importBankTransactions(input: {
  userId: string;
  accountId: string;
  accountCurrencyCode: string;
  externalAccountUid: string;
}): Promise<ImportResult> {
  const supabase = await createClient();
  const external = await getBookedTransactions(input.externalAccountUid);

  const usable = external.filter(
    (row) => row.currencyCode === input.accountCurrencyCode,
  );
  const skippedCurrency = external.length - usable.length;

  if (usable.length === 0) {
    return { imported: 0, skipped: skippedCurrency, importedSumMinor: 0 };
  }

  // Quais destes já existem para este utilizador?
  const known = new Set<string>();
  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const ids = usable
      .slice(i, i + BATCH_SIZE)
      .map((row) => row.externalId);
    const { data, error } = await supabase
      .from("transactions")
      .select("external_id")
      .in("external_id", ids);

    if (error) {
      throw new Error("Não foi possível verificar movimentos existentes.");
    }

    for (const row of data) {
      if (row.external_id) {
        known.add(row.external_id);
      }
    }
  }

  const fresh = usable.filter((row) => !known.has(row.externalId));
  let importedSumMinor = 0;

  // Regras de categorização (D-011): os movimentos importados chegam já
  // categorizados quando uma regra corresponde à descrição.
  const rules = await loadRulesForEngine();

  for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
    const batch = fresh.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("transactions").insert(
      batch.map((row: ExternalTransaction) => {
        const kind =
          row.amountMinor > 0 ? ("income" as const) : ("expense" as const);
        return {
          user_id: input.userId,
          account_id: input.accountId,
          kind,
          amount_minor: row.amountMinor,
          currency_code: input.accountCurrencyCode,
          occurred_on: row.occurredOn,
          description: row.description,
          category_id: categorize({ description: row.description, kind }, rules),
          source: "bank" as const,
          external_id: row.externalId,
        };
      }),
    );

    if (error) {
      throw new Error("Não foi possível importar os movimentos do banco.");
    }

    importedSumMinor += batch.reduce((sum, row) => sum + row.amountMinor, 0);
  }

  return {
    imported: fresh.length,
    skipped: skippedCurrency + known.size,
    importedSumMinor,
  };
}
