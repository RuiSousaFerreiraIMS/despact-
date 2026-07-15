"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { parseTransactionForm, parseTransferForm } from "./validation";

/**
 * Acções de servidor para transacções. A base de dados é a barreira final:
 * o trigger valida conta, moeda e categoria; as funções create_transfer e
 * delete_transfer garantem a atomicidade dos dois lados (D-003).
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

/** Mensagem amigável para erros vindos da base de dados. */
function databaseErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  // P0001 = raise exception nos triggers/funções; as mensagens são nossas e
  // já estão escritas para o utilizador.
  if (error.code === "P0001" && error.message) {
    return error.message;
  }
  return "Não foi possível guardar o movimento. Tente novamente.";
}

function revalidateFinancialViews() {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

export async function createTransaction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseTransactionForm(formData);

  if (!parsed.ok) {
    redirect(`/transactions/new?error=${encodeURIComponent(parsed.error)}`);
  }

  const supabase = await createClient();

  // A moeda do movimento é a da conta (invariante do MVP); o trigger valida.
  const { data: account } = await supabase
    .from("accounts")
    .select("currency_code")
    .eq("id", parsed.value.accountId)
    .maybeSingle();

  if (!account) {
    redirect(
      `/transactions/new?error=${encodeURIComponent("Conta inexistente.")}`,
    );
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    account_id: parsed.value.accountId,
    kind: parsed.value.kind,
    amount_minor: parsed.value.amountMinor,
    currency_code: account.currency_code,
    occurred_on: parsed.value.occurredOn,
    description: parsed.value.description,
    category_id: parsed.value.categoryId,
  });

  if (error) {
    redirect(
      `/transactions/new?error=${encodeURIComponent(databaseErrorMessage(error))}`,
    );
  }

  revalidateFinancialViews();
  redirect("/transactions");
}

export async function updateTransaction(id: string, formData: FormData) {
  await requireUserId();
  const parsed = parseTransactionForm(formData);

  if (!parsed.ok) {
    redirect(
      `/transactions/${id}/edit?error=${encodeURIComponent(parsed.error)}`,
    );
  }

  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("currency_code")
    .eq("id", parsed.value.accountId)
    .maybeSingle();

  if (!account) {
    redirect(
      `/transactions/${id}/edit?error=${encodeURIComponent("Conta inexistente.")}`,
    );
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: parsed.value.accountId,
      kind: parsed.value.kind,
      amount_minor: parsed.value.amountMinor,
      currency_code: account.currency_code,
      occurred_on: parsed.value.occurredOn,
      description: parsed.value.description,
      category_id: parsed.value.categoryId,
    })
    .eq("id", id)
    // Transferências editam-se como operação atómica própria, nunca por aqui.
    .neq("kind", "transfer");

  if (error) {
    redirect(
      `/transactions/${id}/edit?error=${encodeURIComponent(databaseErrorMessage(error))}`,
    );
  }

  revalidateFinancialViews();
  redirect("/transactions");
}

export async function deleteTransaction(id: string) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .neq("kind", "transfer");

  if (error) {
    redirect(
      `/transactions?error=${encodeURIComponent("Não foi possível eliminar o movimento.")}`,
    );
  }

  revalidateFinancialViews();
  redirect("/transactions");
}

export async function createTransfer(formData: FormData) {
  await requireUserId();
  const parsed = parseTransferForm(formData);

  if (!parsed.ok) {
    redirect(
      `/transactions/transfer?error=${encodeURIComponent(parsed.error)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_transfer", {
    p_from_account_id: parsed.value.fromAccountId,
    p_to_account_id: parsed.value.toAccountId,
    p_amount_minor: parsed.value.amountMinor,
    p_occurred_on: parsed.value.occurredOn,
    p_description: parsed.value.description ?? undefined,
  });

  if (error) {
    redirect(
      `/transactions/transfer?error=${encodeURIComponent(databaseErrorMessage(error))}`,
    );
  }

  revalidateFinancialViews();
  redirect("/transactions");
}

export async function deleteTransfer(transferId: string) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_transfer", {
    p_transfer_id: transferId,
  });

  if (error) {
    redirect(
      `/transactions?error=${encodeURIComponent("Não foi possível eliminar a transferência.")}`,
    );
  }

  revalidateFinancialViews();
  redirect("/transactions");
}
