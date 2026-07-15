"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { parseAccountForm } from "./validation";

/**
 * Acções de servidor para contas. Cada acção autentica, valida no servidor e
 * delega a persistência ao Supabase; a RLS é a barreira final de isolamento.
 * Contas nunca são eliminadas: arquivam-se (D-004).
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

export async function createAccount(formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseAccountForm(formData);

  if (!parsed.ok) {
    redirect(`/accounts/new?error=${encodeURIComponent(parsed.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({
    user_id: userId,
    name: parsed.value.name,
    type: parsed.value.type,
    currency_code: parsed.value.currencyCode,
    opening_balance_minor: parsed.value.openingBalanceMinor,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "Já existe uma conta activa com esse nome."
        : "Não foi possível criar a conta. Tente novamente.";
    redirect(`/accounts/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function updateAccount(id: string, formData: FormData) {
  await requireUserId();
  const parsed = parseAccountForm(formData);

  if (!parsed.ok) {
    redirect(
      `/accounts/${id}/edit?error=${encodeURIComponent(parsed.error)}`,
    );
  }

  const supabase = await createClient();
  // A moeda não é editável no MVP: mudá-la invalidaria transacções existentes
  // (a moeda de cada transacção tem de ser igual à da conta).
  const { error } = await supabase
    .from("accounts")
    .update({
      name: parsed.value.name,
      type: parsed.value.type,
      opening_balance_minor: parsed.value.openingBalanceMinor,
    })
    .eq("id", id);

  if (error) {
    const message =
      error.code === "23505"
        ? "Já existe uma conta activa com esse nome."
        : "Não foi possível guardar as alterações.";
    redirect(`/accounts/${id}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function archiveAccount(id: string) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(
      `/accounts?error=${encodeURIComponent("Não foi possível arquivar a conta.")}`,
    );
  }

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function unarchiveAccount(id: string) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) {
    const message =
      error.code === "23505"
        ? "Já existe uma conta activa com esse nome; renomeie-a primeiro."
        : "Não foi possível reactivar a conta.";
    redirect(`/accounts?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/accounts");
  redirect("/accounts");
}
