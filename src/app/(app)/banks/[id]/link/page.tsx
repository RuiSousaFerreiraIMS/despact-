import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FormAlert } from "@/components/form-alert";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { finalizeBankLinks } from "@/features/bank/actions";
import { getBankConnection } from "@/features/bank/queries";
import {
  getExternalAccountSummary,
  getSession,
} from "@/lib/enablebanking/client";
import { formatMinorUnits } from "@/lib/money/format";

/**
 * Mapeamento das contas autorizadas: cada conta bancária escolhida cria uma
 * conta Despact nova e importa o histórico. O saldo inicial é ajustado para
 * o saldo derivado igualar o banco (D-009).
 */
export default async function LinkBankAccountsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const connection = await getBankConnection(id);

  if (!connection) {
    notFound();
  }

  if (connection.status !== "linked") {
    redirect("/banks");
  }

  let accountUids: string[];
  try {
    const session = await getSession(connection.requisition_id);
    accountUids = session.accountUids;
  } catch {
    redirect(
      `/banks?error=${encodeURIComponent("Não foi possível obter as contas autorizadas. Tente novamente.")}`,
    );
  }

  const alreadyLinked = new Set(
    connection.links.map((link) => link.external_account_id),
  );
  const pendingUids = accountUids.filter((uid) => !alreadyLinked.has(uid));

  if (pendingUids.length === 0) {
    redirect(
      `/banks?message=${encodeURIComponent("Todas as contas autorizadas já estão ligadas.")}`,
    );
  }

  const summaries = await Promise.all(
    pendingUids.map((uid) => getExternalAccountSummary(uid)),
  );

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Escolher contas — {connection.institution_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada conta escolhida cria uma conta nova no Despact com o histórico
          importado e o saldo certo.
        </p>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <form action={finalizeBankLinks.bind(null, id)} className="space-y-4">
        {summaries.map((summary) => (
          <Card key={summary.uid}>
            <CardContent className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="account_uid"
                  value={summary.uid}
                  defaultChecked
                  className="mt-1 size-4 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{summary.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {summary.iban ?? "IBAN indisponível"} ·{" "}
                    {summary.currencyCode}
                    {summary.balanceMinor !== null
                      ? ` · Saldo ${formatMinorUnits(summary.balanceMinor, summary.currencyCode)}`
                      : ""}
                  </span>
                </span>
              </label>

              <div className="space-y-1.5">
                <Label htmlFor={`name_${summary.uid}`}>
                  Nome da conta no Despact
                </Label>
                <Input
                  id={`name_${summary.uid}`}
                  name={`name_${summary.uid}`}
                  type="text"
                  defaultValue={`${connection.institution_name} — ${summary.name}`}
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-wrap gap-2">
          <SubmitButton size="lg" pendingLabel="A ligar e importar…">
            Ligar contas e importar
          </SubmitButton>
          <Button asChild variant="outline" size="lg">
            <Link href="/banks">Cancelar</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}
