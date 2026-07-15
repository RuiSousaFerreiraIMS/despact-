"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import { parseGoalForm, parseProgressForm } from "./validation";

type GoalStatus = Database["public"]["Enums"]["goal_status"];

/**
 * Acções de servidor para objectivos. O progresso é manual (D-006): nunca
 * lê nem altera saldos de contas. Objectivos arquivam-se pelo estado; não
 * há eliminação.
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

export async function createGoal(formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseGoalForm(formData);

  if (!parsed.ok) {
    redirect(`/goals/new?error=${encodeURIComponent(parsed.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({
    user_id: userId,
    name: parsed.value.name,
    target_amount_minor: parsed.value.targetAmountMinor,
    currency_code: parsed.value.currencyCode,
    target_date: parsed.value.targetDate,
  });

  if (error) {
    redirect(
      `/goals/new?error=${encodeURIComponent("Não foi possível criar o objectivo.")}`,
    );
  }

  revalidatePath("/goals");
  redirect("/goals");
}

export async function updateGoal(id: string, formData: FormData) {
  await requireUserId();
  const parsed = parseGoalForm(formData);

  if (!parsed.ok) {
    redirect(`/goals/${id}/edit?error=${encodeURIComponent(parsed.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({
      name: parsed.value.name,
      target_amount_minor: parsed.value.targetAmountMinor,
      target_date: parsed.value.targetDate,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/goals/${id}/edit?error=${encodeURIComponent("Não foi possível guardar as alterações.")}`,
    );
  }

  revalidatePath("/goals");
  redirect("/goals");
}

export async function updateGoalProgress(id: string, formData: FormData) {
  await requireUserId();
  const parsed = parseProgressForm(formData);

  if (!parsed.ok) {
    redirect(`/goals?error=${encodeURIComponent(parsed.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ current_amount_minor: parsed.value.currentAmountMinor })
    .eq("id", id);

  if (error) {
    redirect(
      `/goals?error=${encodeURIComponent("Não foi possível actualizar o progresso.")}`,
    );
  }

  revalidatePath("/goals");
  redirect("/goals");
}

async function setGoalStatus(id: string, status: GoalStatus) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ status })
    .eq("id", id);

  if (error) {
    redirect(
      `/goals?error=${encodeURIComponent("Não foi possível alterar o estado do objectivo.")}`,
    );
  }

  revalidatePath("/goals");
  redirect("/goals");
}

export async function completeGoal(id: string) {
  await setGoalStatus(id, "completed");
}

export async function archiveGoal(id: string) {
  await setGoalStatus(id, "archived");
}

export async function reactivateGoal(id: string) {
  await setGoalStatus(id, "active");
}
