"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  getExternalAccountSummary,
  providerErrorMessage,
  startAuthorization,
} from "@/lib/enablebanking/client";
import { createClient } from "@/lib/supabase/server";

import { importBankTransactions, reconcileAccountBalance } from "./sync";

/**
 * Acções de servidor da sincronização bancária (D-009). O consentimento
 * acontece sempre no site do banco; aqui apenas orquestramos referências do
 * fornecedor. A RLS isola tudo por utilizador.
 */

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

/** URL de callback absoluto, coerente com os registados no fornecedor. */
async function callbackUrl(): Promise<string> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${proto}://${host}/api/bank/callback`;
}

/** Inicia a ligação a um banco: cria a conexão e envia ao consentimento. */
export async function startBankConnection(formData: FormData) {
  const userId = await requireUserId();
  const aspspName = String(formData.get("aspsp_name") ?? "").trim();
  const aspspCountry = String(formData.get("aspsp_country") ?? "").trim();

  if (!aspspName || !/^[A-Z]{2}$/.test(aspspCountry)) {
    redirect(
      `/banks/connect?error=${encodeURIComponent("Escolha um banco válido.")}`,
    );
  }

  const supabase = await createClient();
  const { data: connection, error } = await supabase
    .from("bank_connections")
    .insert({
      user_id: userId,
      provider: "enablebanking",
      institution_id: `${aspspCountry}:${aspspName}`,
      institution_name: aspspName,
      // Substituído pelo id de sessão do fornecedor após o consentimento.
      requisition_id: `pending:${crypto.randomUUID()}`,
    })
    .select()
    .single();

  if (error) {
    redirect(
      `/banks/connect?error=${encodeURIComponent("Não foi possível iniciar a ligação.")}`,
    );
  }

  let authUrl: string;
  try {
    const auth = await startAuthorization({
      aspspName,
      aspspCountry,
      redirectUrl: await callbackUrl(),
      state: connection.id,
    });
    authUrl = auth.url;
  } catch {
    await supabase.from("bank_connections").delete().eq("id", connection.id);
    redirect(
      `/banks/connect?error=${encodeURIComponent("O banco não está disponível de momento. Tente novamente.")}`,
    );
  }

  redirect(authUrl);
}

/** Cria contas Despact para as contas bancárias escolhidas e importa o histórico. */
export async function finalizeBankLinks(
  connectionId: string,
  formData: FormData,
) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: connection } = await supabase
    .from("bank_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("status", "linked")
    .maybeSingle();

  if (!connection) {
    redirect(
      `/banks?error=${encodeURIComponent("Ligação bancária inexistente ou por autorizar.")}`,
    );
  }

  const selectedUids = formData.getAll("account_uid").map(String);

  if (selectedUids.length === 0) {
    redirect(
      `/banks/${connectionId}/link?error=${encodeURIComponent("Escolha pelo menos uma conta.")}`,
    );
  }

  let totalImported = 0;

  for (const uid of selectedUids) {
    const name = String(formData.get(`name_${uid}`) ?? "").trim();

    if (!name) {
      redirect(
        `/banks/${connectionId}/link?error=${encodeURIComponent("Dê um nome a cada conta escolhida.")}`,
      );
    }

    const summary = await getExternalAccountSummary(uid);

    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        name,
        type: "current",
        currency_code: summary.currencyCode,
        opening_balance_minor: 0,
      })
      .select()
      .single();

    if (accountError) {
      const message =
        accountError.code === "23505"
          ? `Já existe uma conta activa chamada "${name}".`
          : "Não foi possível criar a conta.";
      redirect(
        `/banks/${connectionId}/link?error=${encodeURIComponent(message)}`,
      );
    }

    const { error: linkError } = await supabase
      .from("bank_account_links")
      .insert({
        user_id: userId,
        connection_id: connectionId,
        account_id: account.id,
        external_account_id: uid,
        last_synced_at: new Date().toISOString(),
      });

    if (linkError) {
      redirect(
        `/banks/${connectionId}/link?error=${encodeURIComponent("Esta conta bancária já está ligada.")}`,
      );
    }

    const result = await importBankTransactions({
      userId,
      accountId: account.id,
      accountCurrencyCode: summary.currencyCode,
      externalAccountUid: uid,
    });

    // D-009: o saldo inicial é o que faz o saldo derivado igualar o banco.
    if (summary.balanceMinor !== null) {
      await supabase
        .from("accounts")
        .update({
          opening_balance_minor:
            summary.balanceMinor - result.importedSumMinor,
        })
        .eq("id", account.id);
    }

    totalImported += result.imported;
  }

  revalidatePath("/banks");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  redirect(
    `/banks?message=${encodeURIComponent(`Contas ligadas. ${totalImported} movimentos importados.`)}`,
  );
}

/** Sincroniza uma conta ligada: importa apenas movimentos novos. */
export async function syncBankLink(linkId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("bank_account_links")
    .select("*, account:accounts(id, currency_code)")
    .eq("id", linkId)
    .maybeSingle();

  if (!link || !link.account) {
    redirect(
      `/banks?error=${encodeURIComponent("Conta ligada inexistente.")}`,
    );
  }

  let result;
  try {
    result = await importBankTransactions({
      userId,
      accountId: link.account.id,
      accountCurrencyCode: link.account.currency_code,
      externalAccountUid: link.external_account_id,
    });
  } catch (error) {
    redirect(`/banks?error=${encodeURIComponent(providerErrorMessage(error))}`);
  }

  await supabase
    .from("bank_account_links")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", linkId);

  revalidatePath("/banks");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  redirect(
    `/banks?message=${encodeURIComponent(
      result.imported === 0
        ? "Sem movimentos novos."
        : `${result.imported} movimentos novos importados.`,
    )}`,
  );
}

/**
 * Reconcilia o saldo de uma conta ligada: importa movimentos novos e ajusta
 * o saldo inicial para que o saldo derivado iguale o saldo contabilístico
 * (booked) do banco. Corrige desvios de saldos anteriores. Nota: movimentos
 * pendentes no banco não são incluídos até serem liquidados.
 */
export async function reconcileBankLink(linkId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("bank_account_links")
    .select("external_account_id, account:accounts(id, currency_code)")
    .eq("id", linkId)
    .maybeSingle();

  if (!link || !link.account) {
    redirect(`/banks?error=${encodeURIComponent("Conta ligada inexistente.")}`);
  }

  let booked: number | null;
  try {
    await importBankTransactions({
      userId,
      accountId: link.account.id,
      accountCurrencyCode: link.account.currency_code,
      externalAccountUid: link.external_account_id,
    });
    booked = await reconcileAccountBalance(
      supabase,
      link.account.id,
      link.external_account_id,
    );
  } catch (error) {
    redirect(`/banks?error=${encodeURIComponent(providerErrorMessage(error))}`);
  }

  await supabase
    .from("bank_account_links")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", linkId);

  revalidatePath("/banks");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  redirect(
    `/banks?message=${encodeURIComponent(
      booked === null
        ? "Movimentos actualizados; o banco não devolveu saldo contabilístico."
        : "Saldo reconciliado com o banco (movimentos pendentes não contam).",
    )}`,
  );
}

/** Revoga uma ligação: remove conexão e mapeamentos; movimentos ficam. */
export async function deleteBankConnection(connectionId: string) {
  await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bank_connections")
    .delete()
    .eq("id", connectionId);

  if (error) {
    redirect(
      `/banks?error=${encodeURIComponent("Não foi possível remover a ligação.")}`,
    );
  }

  revalidatePath("/banks");
  redirect(
    `/banks?message=${encodeURIComponent("Ligação removida. Os movimentos importados foram preservados.")}`,
  );
}
