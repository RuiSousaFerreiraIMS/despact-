"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Fronteira de erro da área autenticada. Erros esperados chegam por query
 * params; isto cobre falhas inesperadas sem expor detalhes sensíveis.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registado no browser para diagnóstico; o servidor regista o digest.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-md pt-12">
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="font-display text-lg font-semibold">
            Algo correu mal
          </p>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar esta página. Os seus dados estão
            seguros — tente novamente.
          </p>
          <Button onClick={reset} size="lg">
            <RefreshCw data-icon="inline-start" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
