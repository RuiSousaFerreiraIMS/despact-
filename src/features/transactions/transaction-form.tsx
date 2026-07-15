"use client";

import Link from "next/link";
import { useState } from "react";

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
  const compatibleCategories = categories.filter(
    (category) => category.type === kind,
  );

  const kindOptions: { value: EntryKind; label: string }[] = [
    { value: "expense", label: "Despesa" },
    { value: "income", label: "Receita" },
  ];

  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {kindOptions.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium ${
                kind === option.value
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="account_id" className="block text-sm font-medium">
          Conta
        </label>
        <select
          id="account_id"
          name="account_id"
          required
          defaultValue={initial?.accountId ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Escolha uma conta
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="block text-sm font-medium">
          Montante
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          placeholder="0,00"
          defaultValue={initial?.amount ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-500">
          Sempre um valor positivo; o tipo define o sinal.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="occurred_on" className="block text-sm font-medium">
          Data
        </label>
        <input
          id="occurred_on"
          name="occurred_on"
          type="date"
          required
          defaultValue={initial?.occurredOn ?? todayIso()}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="category_id" className="block text-sm font-medium">
          Categoria (opcional)
        </label>
        <select
          id="category_id"
          name="category_id"
          key={kind}
          defaultValue={
            initial && initial.kind === kind ? initial.categoryId : ""
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Sem categoria</option>
          {compatibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          Descrição (opcional)
        </label>
        <input
          id="description"
          name="description"
          type="text"
          defaultValue={initial?.description ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          {submitLabel}
        </button>
        <Link
          href="/transactions"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
