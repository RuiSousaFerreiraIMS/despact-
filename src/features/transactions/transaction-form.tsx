"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

import { NEW_CATEGORY_VALUE } from "./validation";
import type { EntryKind } from "./validation";

interface AccountOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
  type: "income" | "expense";
}

export interface TransactionFormInitial {
  kind: EntryKind;
  accountId: string;
  /** Valor absoluto já em texto editável (ex.: "12,50"). */
  amount: string;
  occurredOn: string;
  description: string;
  categoryId: string;
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Formulário de receita/despesa. Componente cliente apenas pela interacção:
 * escolher o tipo filtra as categorias compatíveis de imediato (D-005) e o
 * utilizador nunca escreve o sinal do montante (D-003). A validação efectiva
 * continua no servidor.
 */
export function TransactionForm({
  accounts,
  categories,
  action,
  initial,
  submitLabel,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  action: (formData: FormData) => Promise<void>;
  initial?: TransactionFormInitial;
  submitLabel: string;
}) {
  const [kind, setKind] = useState<EntryKind>(initial?.kind ?? "expense");
  const [categoryChoice, setCategoryChoice] = useState(
    initial?.categoryId ?? "",
  );
  const compatibleCategories = categories.filter(
    (category) => category.type === kind,
  );

  function changeKind(next: EntryKind) {
    setKind(next);
    // Categorias são específicas do tipo; a escolha anterior deixa de valer.
    setCategoryChoice("");
  }

  const kindOptions: { value: EntryKind; label: string }[] = [
    { value: "expense", label: "Despesa" },
    { value: "income", label: "Receita" },
  ];

  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {kindOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors",
                kind === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => changeKind(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="account_id">Conta</Label>
        <NativeSelect
          id="account_id"
          name="account_id"
          required
          defaultValue={initial?.accountId ?? ""}
          className="h-10"
        >
          <option value="" disabled>
            Escolha uma conta
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Montante</Label>
        <Input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          placeholder="0,00"
          defaultValue={initial?.amount ?? ""}
          className="h-10 font-display text-lg tabular-nums"
        />
        <p className="text-xs text-muted-foreground">
          Sempre um valor positivo; o tipo define o sinal.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="occurred_on">Data</Label>
        <Input
          id="occurred_on"
          name="occurred_on"
          type="date"
          required
          defaultValue={initial?.occurredOn ?? todayIso()}
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category_id">Categoria (opcional)</Label>
        <NativeSelect
          id="category_id"
          name="category_id"
          value={categoryChoice}
          onChange={(event) => setCategoryChoice(event.target.value)}
          className="h-10"
        >
          <option value="">Sem categoria</option>
          {compatibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>+ Nova categoria…</option>
        </NativeSelect>
        {categoryChoice === NEW_CATEGORY_VALUE ? (
          <Input
            name="new_category_name"
            type="text"
            required
            autoFocus
            placeholder={
              kind === "expense" ? "Ex.: Ginásio" : "Ex.: Freelance"
            }
            aria-label="Nome da nova categoria"
            className="h-10"
          />
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input
          id="description"
          name="description"
          type="text"
          defaultValue={initial?.description ?? ""}
          className="h-10"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/transactions">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
