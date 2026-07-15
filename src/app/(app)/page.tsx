import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { logout } from "./actions";

/**
 * Página inicial da área autenticada — intencionalmente mínima.
 *
 * Mostra apenas quem está autenticado e permite terminar sessão. O painel
 * financeiro pertence ao Sprint 3 e não deve ser antecipado aqui.
 *
 * O proxy já redirecciona visitantes sem sessão, mas a página revalida no
 * servidor (defesa em profundidade); a RLS continua a ser a barreira final.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Despact</h1>
        <p className="text-sm text-gray-500">
          Sessão iniciada como{" "}
          <span className="font-medium text-gray-900">{user.email}</span>
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Terminar sessão
          </button>
        </form>
      </div>
    </main>
  );
}
