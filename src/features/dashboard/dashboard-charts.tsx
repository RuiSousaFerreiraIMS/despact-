"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMinorUnits } from "@/lib/money/format";

import type { CategorySpend, MonthlyFlow } from "./charts";

const GREEN = "#17a578";
const GREEN_SOFT = "#6cc4a3";
const SLATE = "#64748b";

function euros(minor: number): string {
  return formatMinorUnits(minor, "EUR");
}

/** Gastos por categoria (mês corrente), barras horizontais ordenadas. */
export function SpendingByCategoryChart({ data }: { data: CategorySpend[] }) {
  const top = data.slice(0, 7);
  if (top.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Sem despesas este mês para mostrar.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, top.length * 44)}>
      <BarChart
        data={top}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          formatter={(value) => [euros(Number(value)), "Gasto"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="spentMinor" radius={[0, 6, 6, 0]} maxBarSize={26}>
          {top.map((entry, i) => (
            <Cell key={entry.name} fill={i === 0 ? GREEN : GREEN_SOFT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Receita vs despesa nos últimos 6 meses (barras agrupadas). */
export function MonthlyFlowChart({ data }: { data: MonthlyFlow[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickFormatter={(v: number) => `${Math.round(v / 100)}`}
          tickLine={false}
          axisLine={false}
          width={40}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          formatter={(value, name) => [
            euros(Number(value)),
            name === "incomeMinor" ? "Receita" : "Despesa",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="incomeMinor" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expenseMinor" fill={SLATE} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
