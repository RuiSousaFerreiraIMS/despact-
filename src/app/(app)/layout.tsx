import Link from "next/link";

import { logout } from "./actions";

/**
 * Layout da área autenticada.
 *
 * Navegação mobile-first: cabeçalho compacto com ligações essenciais e
 * terminar sessão. Cresce com as funcionalidades do sprint em curso — sem
 * antecipar painel ou áreas futuras.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/" className="text-base font-semibold">
            Despact
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/accounts" className="py-2 hover:underline">
              Contas
            </Link>
          </nav>
          <form action={logout} className="ml-auto">
            <button
              type="submit"
              className="py-2 text-sm text-gray-500 hover:text-gray-900"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}
