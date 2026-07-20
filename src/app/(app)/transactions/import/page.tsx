import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listAccountsWithBalance } from "@/features/accounts/queries";
import { ImportWizard } from "@/features/import/import-wizard";

/**
 * Importação de extractos CSV (V2 Sprint 6, Unidade B). Disponível para
 * qualquer utilizador — é o caminho de quem não pode ligar o banco
 * directamente. Os movimentos importados são categorizados pelas regras.
 */
export default async function ImportPage() {
  const accounts = await listAccountsWithBalance();
  const activeAccounts = accounts
    .filter((account) => account.archived_at === null)
    .map((account) => ({
      id: account.id ?? "",
      name: account.name ?? "",
      currencyCode: account.currency_code ?? "EUR",
    }));

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Importar extracto (CSV)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exporte o extracto do seu banco em CSV e carregue-o aqui. Escolha as
          colunas, pré-visualize e importe — os movimentos são categorizados
          pelas suas regras.
        </p>
      </div>

      {activeAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Antes de importar, crie a sua primeira{" "}
            <Link
              href="/accounts/new"
              className="font-medium text-foreground underline underline-offset-4"
            >
              conta
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <ImportWizard accounts={activeAccounts} />
      )}

      <Button asChild variant="outline">
        <Link href="/transactions">Voltar aos movimentos</Link>
      </Button>
    </main>
  );
}
