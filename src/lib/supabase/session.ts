import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão do Supabase em cada pedido.
 *
 * O App Router usa cookies para a sessão. Sem renovação, tokens expirados não
 * são actualizados e o utilizador é desligado prematuramente. Esta função corre
 * no proxy (ver `src/proxy.ts`), lê a sessão dos cookies do pedido e reescreve
 * os cookies actualizados na resposta.
 *
 * A protecção de rotas privadas (redireccionar utilizadores sem sessão) será
 * acrescentada no passo de autenticação; aqui apenas mantemos a sessão fresca.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não colocar código entre `createServerClient` e `getUser`.
  // `getUser` revalida o token junto do servidor de autenticação e é o que
  // desencadeia a renovação da sessão.
  await supabase.auth.getUser();

  return supabaseResponse;
}
