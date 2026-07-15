"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Acções de servidor para autenticação.
 *
 * A validação aqui é a validação efectiva: mesmo que a interface valide
 * campos, é o servidor que decide. Erros esperados voltam para a página
 * através de query params, mantendo as páginas como componentes de servidor.
 */

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent("Preencha o e-mail e a palavra-passe.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Caso próprio: a conta existe mas o e-mail ainda não foi confirmado.
    if (error.code === "email_not_confirmed") {
      redirect(
        `/login?error=${encodeURIComponent("Confirme o seu e-mail antes de iniciar sessão. Verifique a caixa de entrada.")}`,
      );
    }
    // Mensagem genérica de propósito: não revelar se o e-mail existe.
    redirect(
      `/login?error=${encodeURIComponent("Credenciais inválidas. Verifique o e-mail e a palavra-passe.")}`,
    );
  }

  redirect("/");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password) {
    redirect(
      `/signup?error=${encodeURIComponent("Preencha o e-mail e a palavra-passe.")}`,
    );
  }

  if (password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent("A palavra-passe deve ter pelo menos 8 caracteres.")}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Lido pelo trigger handle_new_user para preencher profiles.display_name.
      data: { display_name: displayName || null },
    },
  });

  if (error) {
    redirect(
      `/signup?error=${encodeURIComponent("Não foi possível criar a conta. Tente novamente.")}`,
    );
  }

  // Com confirmação de e-mail activa não há sessão imediata: o utilizador
  // tem de abrir o link enviado por e-mail antes de poder iniciar sessão.
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent("Conta criada. Confirme o seu e-mail antes de iniciar sessão.")}`,
    );
  }

  redirect("/");
}
