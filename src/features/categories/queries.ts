import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Category = Database["public"]["Tables"]["categories"]["Row"];

/** Lista as categorias do utilizador autenticado, por tipo e nome. */
export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("type")
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar as categorias.");
  }

  return data;
}

/** Lista apenas categorias activas (para selecção em transacções). */
export async function listActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .is("archived_at", null)
    .order("type")
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar as categorias.");
  }

  return data;
}

/** Obtém uma categoria do utilizador autenticado; `null` se não existir. */
export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a categoria.");
  }

  return data;
}
