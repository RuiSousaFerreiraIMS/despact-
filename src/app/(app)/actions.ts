"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Termina a sessão do utilizador e volta à página de início de sessão. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
