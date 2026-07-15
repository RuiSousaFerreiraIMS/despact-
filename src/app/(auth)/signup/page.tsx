import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signup } from "../actions";

/** Página pública de criação de conta. */
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
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Despact
          </h1>
          <p className="text-sm text-muted-foreground">Crie a sua conta</p>
        </div>

        {error ? <FormAlert variant="error">{error}</FormAlert> : null}

        <Card>
          <CardContent>
            <form action={signup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="display_name">Nome (opcional)</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  type="text"
                  autoComplete="name"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Pelo menos 8 caracteres.
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Criar conta
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Iniciar sessão
          </Link>
        </p>
      </div>
    </main>
  );
}
