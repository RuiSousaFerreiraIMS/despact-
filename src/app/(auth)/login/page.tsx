import Link from "next/link";

import { login } from "../actions";

/**
 * Página pública de início de sessão.
 *
 * Componente de servidor sem JavaScript de cliente: o formulário submete
 * directamente a Server Action `login`. Mensagens de erro/aviso chegam por
 * query params.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Despact</h1>
          <p className="text-sm text-gray-500">Inicie sessão para continuar</p>
        </div>

        {message ? (
          <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={login} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium">
              Palavra-passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Iniciar sessão
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="font-medium underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
