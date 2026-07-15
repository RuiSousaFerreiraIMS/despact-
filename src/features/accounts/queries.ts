import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AccountWithBalance =
  Database["public"]["Views"]["account_balances"]["Row"];

/**
 * Lista as contas do utilizador autenticado com saldo derivado (view
 * account_balances). A RLS garante que só vêm as contas do próprio.
 */
export async function listAccountsWithBalance(): Promise<
  AccountWithBalance[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_balances")
    .select("*")
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar as contas.");
  }

  return data;
}

/** Obtém uma conta do utilizador autenticado; `null` se não existir. */
export async function getAccount(
  id: string,
): Promise<AccountWithBalance | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_balances")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a conta.");
  }

  return data;
}
