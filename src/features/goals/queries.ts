import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Goal = Database["public"]["Tables"]["goals"]["Row"];

/** Lista os objectivos do utilizador: activos primeiro, depois por nome. */
export async function listGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("status")
    .order("target_date", { ascending: true, nullsFirst: false })
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar os objectivos.");
  }

  return data;
}

/** Objectivos activos, para o painel. */
export async function listActiveGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .order("target_date", { ascending: true, nullsFirst: false })
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar os objectivos.");
  }

  return data;
}

/** Obtém um objectivo do utilizador autenticado; `null` se não existir. */
export async function getGoal(id: string): Promise<Goal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar o objectivo.");
  }

  return data;
}
