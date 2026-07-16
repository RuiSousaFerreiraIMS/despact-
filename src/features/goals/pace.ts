/**
 * Ritmo necessário para atingir um objectivo (D-006/D-007): cálculo
 * determinístico e explicável, sem tocar em contas nem reservar dinheiro.
 * Função pura para ser testável.
 */

export interface GoalPace {
  remainingMinor: number;
  monthsLeft: number;
  perMonthMinor: number;
  /** A data-alvo já passou sem o objectivo estar completo. */
  overdue: boolean;
}

function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    (to.getDate() > from.getDate() ? 1 : 0)
  );
}

/**
 * Devolve o que falta e o valor mensal necessário até à data-alvo.
 * `null` quando não há data-alvo ou o objectivo já foi atingido.
 */
export function goalPace(input: {
  targetAmountMinor: number;
  currentAmountMinor: number;
  targetDate: string | null;
  today: Date;
}): GoalPace | null {
  if (!input.targetDate) {
    return null;
  }

  const remainingMinor = input.targetAmountMinor - input.currentAmountMinor;

  if (remainingMinor <= 0) {
    return null;
  }

  const [year, month, day] = input.targetDate.split("-").map(Number);
  const target = new Date(year, month - 1, day);

  if (target < input.today) {
    return { remainingMinor, monthsLeft: 0, perMonthMinor: 0, overdue: true };
  }

  const monthsLeft = Math.max(1, monthsBetween(input.today, target));

  return {
    remainingMinor,
    monthsLeft,
    perMonthMinor: Math.ceil(remainingMinor / monthsLeft),
    overdue: false,
  };
}
