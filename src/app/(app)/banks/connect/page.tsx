/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startBankConnection } from "@/features/bank/actions";
import { listAspsps } from "@/lib/enablebanking/client";

/**
 * Escolha do banco. A lista vem do fornecedor (em sandbox são simuladores;
 * em produção, os bancos portugueses reais). Ao escolher, o utilizador é
 * levado ao consentimento no site do banco.
 */
export default async function ConnectBankPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let banks;
  try {
    banks = await listAspsps("PT");
  } catch {
    banks = null;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Ligar banco
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha o seu banco. A autorização acontece no site do banco, com as
          suas credenciais de sempre — o Despact nunca as vê.
        </p>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      {banks === null ? (
        <FormAlert variant="error">
          Não foi possível carregar a lista de bancos. Verifique a
          configuração do fornecedor e tente novamente.
        </FormAlert>
      ) : (
        <Card className="py-0">
          <ul className="divide-y divide-border">
            {banks.map((bank) => (
              <li key={`${bank.country}:${bank.name}`}>
                <form action={startBankConnection}>
                  <input type="hidden" name="aspsp_name" value={bank.name} />
                  <input
                    type="hidden"
                    name="aspsp_country"
                    value={bank.country}
                  />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted"
                  >
                    {bank.logo ? (
                      <img
                        src={bank.logo}
                        alt=""
                        className="size-8 rounded-md object-contain"
                      />
                    ) : (
                      <span className="size-8 rounded-md bg-muted" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {bank.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {bank.country}
                      </span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button asChild variant="outline">
        <Link href="/banks">Voltar</Link>
      </Button>
    </main>
  );
}
