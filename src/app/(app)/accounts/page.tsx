import { Plus } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { archiveAccount, unarchiveAccount } from "@/features/accounts/actions";
import { listAccountsWithBalance } from "@/features/accounts/queries";
import type { AccountWithBalance } from "@/features/accounts/queries";
import { ACCOUNT_TYPE_LABELS } from "@/features/accounts/validation";
import { formatMinorUnits } from "@/lib/money/format";
import { cn } from "@/lib/utils";

function AccountRow({
  account,
  archived,
}: {
  account: AccountWithBalance;
  archived?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p
          className={cn(
            "flex items-center gap-2 font-medium",
            archived && "text-muted-foreground",
          )}
        >
          <span className="truncate">{account.name}</span>
          {archived ? <Badge variant="secondary">Arquivada</Badge> : null}
        </p>
        <p className="text-sm text-muted-foreground">
          {account.type ? ACCOUNT_TYPE_LABELS[account.type] : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "font-display text-lg font-semibold tabular-nums",
            (account.balance_minor ?? 0) < 0 && "text-destructive",
            archived && "text-muted-foreground",
          )}
        >
          {formatMinorUnits(
            account.balance_minor ?? 0,
            account.currency_code ?? "EUR",
          )}
        </span>
        <div className="flex gap-1">
          {archived ? (
            <form action={unarchiveAccount.bind(null, account.id ?? "")}>
              <Button type="submit" variant="ghost" size="sm">
                Reactivar
              </Button>
            </form>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/accounts/${account.id}/edit`}>Editar</Link>
              </Button>
              <form action={archiveAccount.bind(null, account.id ?? "")}>
                <Button type="submit" variant="ghost" size="sm">
                  Arquivar
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/** Contas com saldo derivado. Arquivar preserva o histórico (D-004). */
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, accounts] = await Promise.all([
    searchParams,
    listAccountsWithBalance(),
  ]);

  const active = accounts.filter((account) => account.archived_at === null);
  const archived = accounts.filter((account) => account.archived_at !== null);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Contas
        </h1>
        <Button asChild>
          <Link href="/accounts/new">
            <Plus data-icon="inline-start" />
            Nova conta
          </Link>
        </Button>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      {active.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ainda não tem contas. Crie a primeira para começar a registar a
            sua vida financeira.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <ul className="divide-y divide-border">
            {active.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </ul>
        </Card>
      )}

      {archived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Arquivadas
          </h2>
          <Card className="bg-muted/40 py-0">
            <ul className="divide-y divide-border">
              {archived.map((account) => (
                <AccountRow key={account.id} account={account} archived />
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </main>
  );
}
