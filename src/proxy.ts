import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

/**
 * Proxy da aplicação (sucessor da convenção `middleware` no Next.js 16).
 *
 * Por agora, a única responsabilidade é renovar a sessão do Supabase em cada
 * pedido relevante. A protecção de rotas privadas será adicionada no passo de
 * autenticação.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre em todos os caminhos excepto:
     * - _next/static (ficheiros estáticos)
     * - _next/image (optimização de imagens)
     * - favicon.ico
     * - ficheiros de imagem comuns
     * Assim evitamos renovar a sessão em pedidos de recursos estáticos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
