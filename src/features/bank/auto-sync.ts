"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { importBankTransactions } from "./sync";

/**
 * Sincronização automática ao abrir a app.
 *
 * Corre com a sessão do próprio utilizador (a RLS aplica-se), pelo que não
 * usa privilégios elevados. É moderada: só sincroniza contas cujo último
 * sync tem mais de STALE_HOURS horas, respeitando o limite PSD2 de acessos
 * sem o utilizador presente e evitando pedidos desnecessários.
 */

const STALE_HOURS = 6;

export async function syncStaleBankLinks(): Promise<{ imported: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { imported: 0 };
  }

  const { data: links } = await supabase
    .from("bank_account_links")
    .select(
      "id, external_account_id, last_synced_at, account:accounts(id, currency_code), connection:bank_connections(status, consent_expires_at)",
    );

  if (!links || links.length === 0) {
    return { imported: 0 };
  }

  const now = Date.now();
  const staleThreshold = now - STALE_HOURS * 60 * 60 * 1000;
  let imported = 0;

  for (const link of links) {
    const connection = link.connection;
    const account = link.account;

    // Só contas activas, com consentimento válido e sincronização vencida.
    if (!account || !connection || connection.status !== "linked") {
      continue;
    }
    if (
      connection.consent_expires_at &&
      new Date(connection.consent_expires_at).getTime() < now
    ) {
      continue;
    }
    if (
      link.last_synced_at &&
      new Date(link.last_synced_at).getTime() > staleThreshold
    ) {
      continue;
    }

    try {
      const result = await importBankTransactions({
        userId: user.id,
        accountId: account.id,
        accountCurrencyCode: account.currency_code,
        externalAccountUid: link.external_account_id,
      });
      imported += result.imported;
    } catch {
      // Falha de uma conta (consentimento expirado, indisponibilidade) não
      // deve interromper as restantes; será reportada no sync manual.
    }

    await supabase
      .from("bank_account_links")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", link.id);
  }

  if (imported > 0) {
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/banks");
  }

  return { imported };
}
