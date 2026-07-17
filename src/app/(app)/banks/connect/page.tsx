import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { BankPicker } from "@/features/bank/bank-picker";
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
        <BankPicker banks={banks} />
      )}

      <Button asChild variant="outline">
        <Link href="/banks">Voltar</Link>
      </Button>
    </main>
  );
}
