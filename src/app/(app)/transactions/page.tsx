import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteTransaction,
  deleteTransfer,
} from "@/features/transactions/actions";
import { listRecentTransactions } from "@/features/transactions/queries";
import type { TransactionListItem } from "@/features/transactions/queries";
import { formatMinorUnits } from "@/lib/money/format";
import { cn } from "@/lib/utils";

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

const KIND_ICON = {
  income: ArrowUpRight,
  expense: ArrowDownLeft,
  transfer: ArrowLeftRight,
} as const;

function TransactionRow({
  transaction,
}: {
  transaction: TransactionListItem;
}) {
  const isTransfer = transaction.kind === "transfer";
  const Icon = KIND_ICON[transaction.kind];

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          transaction.kind === "income" && "bg-accent text-accent-foreground",
          transaction.kind === "expense" &&
            "bg-secondary text-secondary-foreground",
          isTransfer && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {transaction.description ??
            transaction.category?.name ??
            (isTransfer ? "Transferência" : "Sem descrição")}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {formatDate(transaction.occurred_on)} · {transaction.account?.name}
          {isTransfer ? (
            <Badge variant="secondary">Transferência</Badge>
          ) : transaction.category?.name && transaction.description ? (
            <span className="text-xs">{transaction.category.name}</span>
          ) : null}
        </p>
      </div>

      <span
        className={cn(
          "font-display font-semibold tabular-nums",
          transaction.kind === "income" && "text-success",
          isTransfer && "text-muted-foreground",
        )}
      >
        {formatMinorUnits(transaction.amount_minor, transaction.currency_code)}
      </span>

      <span className="flex gap-1">
        {isTransfer ? (
          transaction.amount_minor < 0 && transaction.transfer_id ? (
            <form action={deleteTransfer.bind(null, transaction.transfer_id)}>
              <Button type="submit" variant="ghost" size="sm">
                Eliminar
              </Button>
            </form>
          ) : null
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/transactions/${transaction.id}/edit`}>Editar</Link>
            </Button>
            <form action={deleteTransaction.bind(null, transaction.id)}>
              <Button type="submit" variant="ghost" size="sm">
                Eliminar
              </Button>
            </form>
          </>
        )}
      </span>
    </li>
  );
}

/** Histórico de movimentos; transferências identificadas e eliminadas em par. */
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, transactions] = await Promise.all([
    searchParams,
    listRecentTransactions(),
  ]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Movimentos
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/transactions/transfer">
              <ArrowLeftRight data-icon="inline-start" />
              Transferência
            </Link>
          </Button>
          <Button asChild>
            <Link href="/transactions/new">
              <Plus data-icon="inline-start" />
              Novo movimento
            </Link>
          </Button>
        </div>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ainda não tem movimentos. Registe a primeira despesa ou receita —
            demora menos de 15 segundos.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <ul className="divide-y divide-border">
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
