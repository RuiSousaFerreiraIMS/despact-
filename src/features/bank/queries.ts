import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type BankConnection =
  Database["public"]["Tables"]["bank_connections"]["Row"];
export type BankAccountLink =
  Database["public"]["Tables"]["bank_account_links"]["Row"];

export interface BankConnectionWithLinks extends BankConnection {
  links: (BankAccountLink & { account: { name: string } | null })[];
}

/** Conexões bancárias do utilizador com as contas ligadas. */
export async function listBankConnections(): Promise<
  BankConnectionWithLinks[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_connections")
    .select("*, links:bank_account_links(*, account:accounts(name))")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar as ligações bancárias.");
  }

  return data;
}

/** Obtém uma conexão do utilizador autenticado; `null` se não existir. */
export async function getBankConnection(
  id: string,
): Promise<BankConnectionWithLinks | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_connections")
    .select("*, links:bank_account_links(*, account:accounts(name))")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a ligação bancária.");
  }

  return data;
}
