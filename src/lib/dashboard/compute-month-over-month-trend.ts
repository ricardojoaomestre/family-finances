export type MonthOverMonthTrend =
  | { kind: 'hidden' }
  | {
      kind: 'flat';
      previousValue: string;
    }
  | {
      kind: 'up' | 'down';
      difference: string;
      percent: number;
      previousValue: string;
    };

export function computeMonthOverMonthTrend(
  currentValue: string,
  previousValue: string | null | undefined,
): MonthOverMonthTrend {
  if (previousValue === null || previousValue === undefined) {
    return { kind: 'hidden' };
  }

  const current = Number(currentValue);
  const previous = Number(previousValue);

  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { kind: 'hidden' };
  }

  const difference = current - previous;

  if (difference === 0) {
    return { kind: 'flat', previousValue };
  }

  const percent = computeTrendPercent(difference, previous);

  return {
    kind: difference > 0 ? 'up' : 'down',
    difference: difference.toFixed(2),
    percent,
    previousValue,
  };
}

function computeTrendPercent(difference: number, previous: number): number {
  if (previous === 0) {
    return 100;
  }

  const absPercent = Math.abs((difference / previous) * 100);

  if (absPercent > 0 && absPercent < 1) {
    return Math.round(absPercent * 10) / 10;
  }

  return Math.round(absPercent);
}
