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
 * Também protege as rotas privadas: sem sessão, qualquer caminho fora da área
 * pública redirecciona para /login. Isto melhora a experiência, mas a barreira
 * de segurança efectiva continua a ser a RLS na base de dados.
 */

/** Caminhos acessíveis sem sessão iniciada. */
const PUBLIC_PATHS = ["/login", "/signup", "/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Sem sessão, só a área pública é acessível.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Com sessão, as páginas de entrada deixam de fazer sentido.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
