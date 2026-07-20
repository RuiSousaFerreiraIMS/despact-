"use client";

/* eslint-disable @next/next/no-img-element */
import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startBankConnection } from "@/features/bank/actions";

interface Bank {
  name: string;
  country: string;
  logo: string | null;
}

/**
 * Normaliza para pesquisa sem distinguir acentos nem maiúsculas.
 * Remove marcas diacríticas combinatórias (U+0300–U+036F) por código de
 * ponto, evitando ambiguidades de literais na fonte.
 */
function normalize(value: string): string {
  const decomposed = value.normalize("NFD");
  let result = "";
  for (const char of decomposed) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x0300 || code > 0x036f) {
      result += char;
    }
  }
  return result.toLowerCase();
}

/**
 * Lista de bancos com pesquisa. Componente cliente apenas pela interacção do
 * filtro; cada banco submete a Server Action `startBankConnection`.
 */
/** Linha de banco com estado de espera ao iniciar o consentimento. */
function BankRow({
  name,
  country,
  logo,
}: {
  name: string;
  country: string;
  logo: string | null;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-8 animate-spin p-1.5 text-muted-foreground" />
      ) : logo ? (
        <img src={logo} alt="" className="size-8 rounded-md object-contain" />
      ) : (
        <span className="size-8 rounded-md bg-muted" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block text-xs text-muted-foreground">
          {pending ? "A abrir o banco…" : country}
        </span>
      </span>
    </button>
  );
}

export function BankPicker({ banks }: { banks: Bank[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) {
      return banks;
    }
    return banks.filter((bank) => normalize(bank.name).includes(q));
  }, [banks, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Procurar banco…"
          aria-label="Procurar banco"
          className="h-11 pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum banco corresponde à pesquisa.
          </p>
        </Card>
      ) : (
        <Card className="py-0">
          <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
            {filtered.map((bank) => (
              <li key={`${bank.country}:${bank.name}`}>
                <form action={startBankConnection}>
                  <input type="hidden" name="aspsp_name" value={bank.name} />
                  <input
                    type="hidden"
                    name="aspsp_country"
                    value={bank.country}
                  />
                  <BankRow name={bank.name} country={bank.country} logo={bank.logo} />
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {banks.length} bancos
      </p>
    </div>
  );
}
