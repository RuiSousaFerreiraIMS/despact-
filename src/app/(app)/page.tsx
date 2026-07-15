import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Página inicial da área autenticada — intencionalmente mínima.
 * O painel financeiro pertence ao Sprint 3 e não deve ser antecipado aqui.
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
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Bem-vindo</h1>
      <p className="text-sm text-gray-500">
        Sessão iniciada como{" "}
        <span className="font-medium text-gray-900">{user.email}</span>.
      </p>
      <p className="text-sm text-gray-500">
        Comece por gerir as suas{" "}
        <Link href="/accounts" className="font-medium underline">
          contas
        </Link>
        .
      </p>
    </main>
  );
}
