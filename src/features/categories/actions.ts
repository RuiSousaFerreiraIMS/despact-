"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { parseCategoryForm, parseCategoryRenameForm } from "./validation";

/**
 * Acções de servidor para categorias. Categorias arquivam-se, nunca se
 * eliminam (D-005); o tipo é fixo após a criação para não invalidar
 * transacções já classificadas.
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

/** Cria o conjunto de categorias sugeridas (D-008); idempotente. */
export async function seedDefaultCategories() {
  const userId = await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_default_categories", {
    p_user_id: userId,
  });

  if (error) {
    redirect(
      `/categories?error=${encodeURIComponent("Não foi possível criar as categorias sugeridas.")}`,
    );
  }

  revalidatePath("/categories");
  redirect("/categories");
}

export async function createCategory(formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseCategoryForm(formData);

  if (!parsed.ok) {
    redirect(`/categories?error=${encodeURIComponent(parsed.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    user_id: userId,
    name: parsed.value.name,
    type: parsed.value.type,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "Já existe uma categoria activa com esse nome e tipo."
        : "Não foi possível criar a categoria.";
    redirect(`/categories?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/categories");
  redirect("/categories");
}

export async function renameCategory(id: string, formData: FormData) {
  await requireUserId();
  const parsed = parseCategoryRenameForm(formData);

  if (!parsed.ok) {
    redirect(
      `/categories/${id}/edit?error=${encodeURIComponent(parsed.error)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.value.name })
    .eq("id", id);

  if (error) {
    const message =
      error.code === "23505"
        ? "Já existe uma categoria activa com esse nome e tipo."
        : "Não foi possível guardar as alterações.";
    redirect(`/categories/${id}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/categories");
  redirect("/categories");
}

export async function archiveCategory(id: string) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(
      `/categories?error=${encodeURIComponent("Não foi possível arquivar a categoria.")}`,
    );
  }

  revalidatePath("/categories");
  redirect("/categories");
}

export async function unarchiveCategory(id: string) {
  await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) {
    const message =
      error.code === "23505"
        ? "Já existe uma categoria activa com esse nome e tipo; renomeie-a primeiro."
        : "Não foi possível reactivar a categoria.";
    redirect(`/categories?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/categories");
  redirect("/categories");
}
