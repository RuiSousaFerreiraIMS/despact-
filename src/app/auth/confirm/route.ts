import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Confirmação de e-mail (e outros links de autenticação por e-mail).
 *
 * O e-mail enviado pelo Supabase aponta para esta rota com `token_hash` e
 * `type`. Validamos o token no servidor e, em caso de sucesso, o utilizador
 * fica com sessão iniciada e é levado para a aplicação.
 *
 * É um Route Handler porque é um ponto de entrada HTTP externo (um link num
 * e-mail), o único caso em que a arquitectura os prevê.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent("Ligação de confirmação inválida ou expirada.")}`,
      request.url,
    ),
  );
}
