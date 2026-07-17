import { type NextRequest, NextResponse } from "next/server";

import { createSession } from "@/lib/enablebanking/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorno do consentimento bancário (D-009).
 *
 * O banco devolve `code` (troca por sessão) e `state` (o id da conexão
 * Despact). Route Handler porque é um ponto de entrada HTTP externo — o
 * único caso em que a arquitectura os prevê.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/banks?error=${encodeURIComponent(message)}`, request.url),
    );

  if (!code || !state) {
    return fail("A autorização no banco foi cancelada ou falhou.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // A RLS garante que só encontramos conexões do próprio utilizador.
  const { data: connection } = await supabase
    .from("bank_connections")
    .select("id, status")
    .eq("id", state)
    .maybeSingle();

  if (!connection || connection.status !== "pending") {
    return fail("Ligação bancária inexistente ou já concluída.");
  }

  let session;
  try {
    session = await createSession(code);
  } catch {
    return fail("Não foi possível concluir a autorização. Tente novamente.");
  }

  const { error } = await supabase
    .from("bank_connections")
    .update({
      requisition_id: session.sessionId,
      status: "linked",
      consent_expires_at: session.validUntil,
    })
    .eq("id", connection.id);

  if (error) {
    return fail("Não foi possível guardar a ligação. Tente novamente.");
  }

  return NextResponse.redirect(
    new URL(`/banks/${connection.id}/link`, request.url),
  );
}
