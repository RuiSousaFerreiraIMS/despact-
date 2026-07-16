import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** 404 dentro da área autenticada (ex.: conta ou objectivo inexistente). */
export default function NotFound() {
  return (
    <main className="mx-auto max-w-md pt-12">
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="font-display text-lg font-semibold">
            Página não encontrada
          </p>
          <p className="text-sm text-muted-foreground">
            O que procura não existe ou já não está disponível.
          </p>
          <Button asChild size="lg">
            <Link href="/">Voltar ao painel</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
