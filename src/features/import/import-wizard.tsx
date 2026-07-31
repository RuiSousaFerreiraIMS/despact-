"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatMinorUnits } from "@/lib/money/format";

import { importCsvTransactions } from "./actions";
import {
  detectDelimiter,
  detectHeaderRowIndex,
  normalizeRows,
  parseCsv,
} from "./csv";
import type { ColumnMapping } from "./csv";

interface AccountOption {
  id: string;
  name: string;
  currencyCode: string;
}

type AmountMode = "single" | "split";

const PREVIEW_LIMIT = 8;

/**
 * Adivinha a coluna a partir do cabeçalho, por ORDEM DE PRIORIDADE das
 * palavras-chave: tenta a primeira palavra em todas as colunas antes de
 * passar à seguinte. Assim "montante" ganha a "valor" (que também aparece
 * em colunas de data como "D. VALOR").
 */
function guessColumn(headers: string[], keywords: string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const keyword of keywords) {
    const index = lower.findIndex((cell) => cell.includes(keyword));
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}

export function ImportWizard({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [grid, setGrid] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [skipRows, setSkipRows] = useState(0);
  const [dateIndex, setDateIndex] = useState(0);
  const [descriptionIndex, setDescriptionIndex] = useState(1);
  const [amountMode, setAmountMode] = useState<AmountMode>("single");
  const [amountIndex, setAmountIndex] = useState(2);
  const [debitIndex, setDebitIndex] = useState(2);
  const [creditIndex, setCreditIndex] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const currency =
    accounts.find((a) => a.id === accountId)?.currencyCode ?? "EUR";
  const headerRow = grid?.[skipRows] ?? [];
  const columnCount = headerRow.length;
  const headers = hasHeader ? headerRow : [];

  async function onFile(file: File) {
    setError(null);
    setDone(null);
    const text = await file.text();
    const rows = parseCsv(text, detectDelimiter(text));
    if (rows.length === 0) {
      setError("O ficheiro está vazio ou não é um CSV válido.");
      setGrid(null);
      return;
    }
    setFileName(file.name);
    setGrid(rows);

    // Detectar a linha de cabeçalho, saltando o preâmbulo do extracto.
    const headerIdx = detectHeaderRowIndex(rows);
    const skip = headerIdx >= 0 ? headerIdx : 0;
    const header = headerIdx >= 0;
    setSkipRows(skip);
    setHasHeader(header);

    if (header) {
      const hdr = rows[headerIdx];
      const d = guessColumn(hdr, ["data", "date"]);
      const desc = guessColumn(hdr, ["descri", "movimento", "detalhe"]);
      const amt = guessColumn(hdr, [
        "montante",
        "valor",
        "amount",
        "importância",
      ]);
      const deb = guessColumn(hdr, ["débito", "debito", "debit", "saída", "saida"]);
      const cred = guessColumn(hdr, ["crédito", "credito", "credit", "entrada"]);
      // Preferir a data contabilística, quando existe mais do que uma coluna de data.
      const dCont = guessColumn(hdr, ["contabil"]);
      setDateIndex(dCont >= 0 ? dCont : d >= 0 ? d : 0);
      setDescriptionIndex(desc >= 0 ? desc : 1);
      if (amt >= 0) {
        setAmountMode("single");
        setAmountIndex(amt);
      } else if (deb >= 0 && cred >= 0) {
        setAmountMode("split");
        setDebitIndex(deb);
        setCreditIndex(cred);
      }
    }
  }

  const mapping: ColumnMapping = useMemo(
    () => ({
      hasHeader,
      skipRows,
      dateIndex,
      descriptionIndex,
      ...(amountMode === "single"
        ? { amountIndex }
        : { debitIndex, creditIndex }),
    }),
    [
      hasHeader,
      skipRows,
      dateIndex,
      descriptionIndex,
      amountMode,
      amountIndex,
      debitIndex,
      creditIndex,
    ],
  );

  const normalized = useMemo(
    () => (grid ? normalizeRows(grid, mapping) : null),
    [grid, mapping],
  );

  function columnOptions() {
    return Array.from({ length: columnCount }, (_, i) => (
      <option key={i} value={i}>
        {hasHeader && headers[i] ? headers[i] : `Coluna ${i + 1}`}
      </option>
    ));
  }

  function onImport() {
    if (!normalized || normalized.rows.length === 0) {
      setError("Não há movimentos válidos para importar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await importCsvTransactions(accountId, normalized.rows);
      if (result.ok) {
        const skippedNote =
          result.skipped > 0
            ? ` ${result.skipped} já existiam e foram ignorados.`
            : "";
        setDone(
          result.imported === 0
            ? `Nada novo para importar — todos os ${result.skipped} movimentos já estavam registados.`
            : `${result.imported} movimentos importados.${skippedNote}`,
        );
        setGrid(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {done ? <FormAlert variant="success">{done}</FormAlert> : null}

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="account">Conta de destino</Label>
            <NativeSelect
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currencyCode})
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file">Ficheiro CSV do extracto</Label>
            <input
              id="file"
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void onFile(file);
                }
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-muted"
            />
            {fileName ? (
              <p className="text-xs text-muted-foreground">{fileName}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {grid ? (
        <>
          <Card>
            <CardContent className="space-y-4">
              <p className="font-display text-sm font-semibold">
                Mapear colunas
              </p>

              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="skip-rows">Linhas a ignorar no topo</Label>
                  <input
                    id="skip-rows"
                    type="number"
                    min={0}
                    value={skipRows}
                    onChange={(e) =>
                      setSkipRows(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="h-10 w-24 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 pb-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  A linha seguinte é um cabeçalho
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <NativeSelect
                    value={dateIndex}
                    onChange={(e) => setDateIndex(Number(e.target.value))}
                    className="h-10"
                  >
                    {columnOptions()}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <NativeSelect
                    value={descriptionIndex}
                    onChange={(e) =>
                      setDescriptionIndex(Number(e.target.value))
                    }
                    className="h-10"
                  >
                    {columnOptions()}
                  </NativeSelect>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Montante</Label>
                <div className="flex flex-wrap gap-2 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="amount-mode"
                      checked={amountMode === "single"}
                      onChange={() => setAmountMode("single")}
                      className="accent-primary"
                    />
                    Uma coluna (com sinal)
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="amount-mode"
                      checked={amountMode === "split"}
                      onChange={() => setAmountMode("split")}
                      className="accent-primary"
                    />
                    Débito e crédito separados
                  </label>
                </div>
              </div>

              {amountMode === "single" ? (
                <div className="space-y-1.5">
                  <Label>Coluna do montante</Label>
                  <NativeSelect
                    value={amountIndex}
                    onChange={(e) => setAmountIndex(Number(e.target.value))}
                    className="h-10"
                  >
                    {columnOptions()}
                  </NativeSelect>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Débito (saídas)</Label>
                    <NativeSelect
                      value={debitIndex}
                      onChange={(e) => setDebitIndex(Number(e.target.value))}
                      className="h-10"
                    >
                      {columnOptions()}
                    </NativeSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Crédito (entradas)</Label>
                    <NativeSelect
                      value={creditIndex}
                      onChange={(e) => setCreditIndex(Number(e.target.value))}
                      className="h-10"
                    >
                      {columnOptions()}
                    </NativeSelect>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-sm font-semibold">
                  Pré-visualização
                </p>
                <p className="text-sm text-muted-foreground">
                  {normalized?.rows.length ?? 0} válidos
                  {normalized && normalized.errors.length > 0
                    ? ` · ${normalized.errors.length} ignorados`
                    : ""}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Data</th>
                      <th className="py-2 pr-4 font-medium">Descrição</th>
                      <th className="py-2 text-right font-medium">Montante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalized?.rows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                      <tr key={i} className="border-b border-border/60">
                        <td className="py-2 pr-4 tabular-nums">
                          {row.occurredOn}
                        </td>
                        <td className="max-w-[16rem] truncate py-2 pr-4">
                          {row.description ?? "—"}
                        </td>
                        <td
                          className={`py-2 text-right font-display tabular-nums ${
                            row.amountMinor < 0 ? "" : "text-success"
                          }`}
                        >
                          {formatMinorUnits(row.amountMinor, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {normalized && normalized.rows.length > PREVIEW_LIMIT ? (
                <p className="text-xs text-muted-foreground">
                  … e mais {normalized.rows.length - PREVIEW_LIMIT} movimentos.
                </p>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Importar o mesmo ficheiro duas vezes cria movimentos
                repetidos. Confirme a pré-visualização antes de importar.
              </p>

              <Button
                type="button"
                size="lg"
                onClick={onImport}
                disabled={isPending || (normalized?.rows.length ?? 0) === 0}
              >
                {isPending
                  ? "A importar…"
                  : `Importar ${normalized?.rows.length ?? 0} movimentos`}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
