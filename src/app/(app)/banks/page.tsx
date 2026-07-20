import { Landmark, Plus, RefreshCw, Scale } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteBankConnection,
  reconcileBankLink,
  syncBankLink,
} from "@/features/bank/actions";
import { listBankConnections } from "@/features/bank/queries";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Por autorizar",
  linked: "Activa",
  expired: "Expirada",
  revoked: "Revogada",
};

/**
 * Ligações bancárias (D-009). O consentimento PSD2 expira (~90 dias);
 * renovar é criar uma nova ligação ao mesmo banco.
 */
export default async function BanksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ error, message }, connections] = await Promise.all([
    searchParams,
    listBankConnections(),
  ]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Bancos
        </h1>
        <Button asChild>
          <Link href="/banks/connect">
            <Plus data-icon="inline-start" />
            Ligar banco
          </Link>
        </Button>
      </div>

      {message ? <FormAlert variant="success">{message}</FormAlert> : null}
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      {connections.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground">
            <Landmark className="mx-auto size-8 text-muted-foreground/60" />
            <p>
              Ligue o seu banco para os movimentos entrarem automaticamente no
              Despact. A autorização acontece no site do próprio banco — o
              Despact nunca vê as suas credenciais.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => {
            const expired =
              connection.consent_expires_at !== null &&
              new Date(connection.consent_expires_at) < new Date();
            const statusKey = expired ? "expired" : connection.status;

            return (
              <Card key={connection.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-medium">
                      <Landmark className="size-4 text-muted-foreground" />
                      {connection.institution_name}
                      <Badge
                        variant="secondary"
                        className={
                          statusKey === "linked"
                            ? "bg-success/15 text-success"
                            : statusKey === "expired"
                              ? "bg-destructive/10 text-destructive"
                              : undefined
                        }
                      >
                        {STATUS_LABELS[statusKey] ?? statusKey}
                      </Badge>
                    </p>
                    {connection.consent_expires_at ? (
                      <p className="text-xs text-muted-foreground">
                        Consentimento até{" "}
                        {formatDateTime(connection.consent_expires_at)}
                      </p>
                    ) : null}
                  </div>

                  {connection.links.length > 0 ? (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {connection.links.map((link) => (
                        <li
                          key={link.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {link.account?.name ?? "Conta"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {link.last_synced_at
                                ? `Sincronizada em ${formatDateTime(link.last_synced_at)}`
                                : "Nunca sincronizada"}
                            </p>
                          </div>
                          {statusKey === "linked" ? (
                            <div className="flex flex-wrap gap-2">
                              <form action={syncBankLink.bind(null, link.id)}>
                                <SubmitButton
                                  variant="outline"
                                  size="sm"
                                  pendingLabel="A sincronizar…"
                                  icon={<RefreshCw data-icon="inline-start" />}
                                >
                                  Sincronizar
                                </SubmitButton>
                              </form>
                              <form
                                action={reconcileBankLink.bind(null, link.id)}
                              >
                                <SubmitButton
                                  variant="ghost"
                                  size="sm"
                                  pendingLabel="A reconciliar…"
                                  icon={<Scale data-icon="inline-start" />}
                                >
                                  Reconciliar saldo
                                </SubmitButton>
                              </form>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : connection.status === "linked" ? (
                    <p className="text-sm text-muted-foreground">
                      Autorizado, mas ainda sem contas ligadas.{" "}
                      <Link
                        href={`/banks/${connection.id}/link`}
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        Escolher contas
                      </Link>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      A autorização não foi concluída. Remova e volte a ligar o
                      banco.
                    </p>
                  )}

                  <div className="flex justify-end">
                    <form
                      action={deleteBankConnection.bind(null, connection.id)}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        Remover ligação
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Os movimentos importados ficam sem categoria e podem ser editados como
        quaisquer outros. Remover uma ligação nunca apaga movimentos.
      </p>
    </main>
  );
}
