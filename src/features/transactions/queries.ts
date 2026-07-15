import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export interface TransactionListItem extends Transaction {
  account: { name: string } | null;
  category: { name: string } | null;
}

const LIST_LIMIT = 50;

/**
 * Lista os movimentos mais recentes do utilizador com nomes de conta e
 * categoria. Limitado aos últimos 50 no MVP; paginação virá com uso real.
 */
export async function listRecentTransactions(): Promise<
  TransactionListItem[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, account:accounts(name), category:categories(name)")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    throw new Error("Não foi possível carregar as transacções.");
  }

  return data;
}

/** Obtém um movimento do utilizador autenticado; `null` se não existir. */
export async function getTransaction(
  id: string,
): Promise<Transaction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a transacção.");
  }

  return data;
}
