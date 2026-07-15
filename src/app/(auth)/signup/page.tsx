import Link from "next/link";

import { signup } from "../actions";

/**
 * Página pública de criação de conta.
 *
 * Após o registo, o Supabase envia um e-mail de confirmação; o utilizador só
 * consegue iniciar sessão depois de abrir o link (ver /auth/confirm).
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Despact</h1>
          <p className="text-sm text-gray-500">Crie a sua conta</p>
        </div>

        {error ? (
          <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={signup} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="display_name" className="block text-sm font-medium">
              Nome (opcional)
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

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
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500">Pelo menos 8 caracteres.</p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Criar conta
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium underline">
            Iniciar sessão
          </Link>
        </p>
      </div>
    </main>
  );
}
