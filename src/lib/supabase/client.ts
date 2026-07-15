import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser.
 *
 * Usar apenas em componentes cliente ("use client"), onde é preciso interagir
 * com o Supabase a partir do browser. Componentes e acções de servidor devem
 * usar `createClient` de `./server`.
 *
 * Só usa variáveis `NEXT_PUBLIC_*`, seguras para o cliente. Nenhuma chave
 * secreta ou `service_role` é enviada para o browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
