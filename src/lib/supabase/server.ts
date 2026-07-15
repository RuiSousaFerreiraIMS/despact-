import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para o servidor.
 *
 * Usar em componentes de servidor, Server Actions e Route Handlers. Lê e
 * escreve a sessão através dos cookies do pedido, para que a autenticação
 * funcione com renderização no servidor.
 *
 * É assíncrono porque `cookies()` do Next.js é assíncrono no App Router.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` foi chamado a partir de um componente de servidor.
            // Pode ser ignorado: o middleware trata da renovação da sessão.
          }
        },
      },
    },
  );
}
