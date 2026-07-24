"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { importBankTransactions, reconcileAccountBalance } from "./sync";

/**
 * Sincronização automática ao abrir a app.
 *
 * Corre com a sessão do próprio utilizador (a RLS aplica-se), pelo que não
 * usa privilégios elevados. Ao abrir, importa os movimentos liquidados novos
 * e realinha o saldo — sem clique manual. É moderada por um curto período de
 * arrefecimento (o utilizador está presente, pelo que os limites PSD2 são
 * mais permissivos), evitando pedidos em navegações repetidas.
 *
 * Nota: movimentos ainda pendentes no banco só aparecem quando este os
 * liquida (1-3 dias úteis); é um limite do Open Banking, não da app.
 */

const COOLDOWN_MINUTES = 180;

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
  const cooldownThreshold = now - COOLDOWN_MINUTES * 60 * 1000;
  let imported = 0;
  let reconciled = false;

  for (const link of links) {
    const connection = link.connection;
    const account = link.account;

    // Só contas activas, com consentimento válido e fora do arrefecimento.
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
      new Date(link.last_synced_at).getTime() > cooldownThreshold
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

      // Realinha o saldo automaticamente (sem clique manual).
      await reconcileAccountBalance(
        supabase,
        account.id,
        link.external_account_id,
      );
      reconciled = true;
    } catch {
      // Falha de uma conta (consentimento expirado, indisponibilidade) não
      // deve interromper as restantes; será reportada no sync manual.
    }

    await supabase
      .from("bank_account_links")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", link.id);
  }

  if (imported > 0 || reconciled) {
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/banks");
  }

  return { imported };
}
