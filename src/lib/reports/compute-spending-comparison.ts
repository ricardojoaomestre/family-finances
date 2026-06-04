import type { SpendingCategoryAverage } from '@/lib/reports/get-spending-category-month-averages';

export type SpendingComparison =
  | { kind: 'hidden' }
  | {
      kind: 'flat';
      average: string;
      monthLabels: string;
    }
  | {
      kind: 'up' | 'down';
      percent: number;
      average: string;
      monthLabels: string;
    };

export function computeSpendingComparison(
  currentTotal: string,
  averageData: SpendingCategoryAverage | undefined,
): SpendingComparison {
  if (!averageData) {
    return { kind: 'hidden' };
  }

  const current = Number(currentTotal);
  const average = Number(averageData.average);

  if (!Number.isFinite(current) || !Number.isFinite(average) || average === 0) {
    return { kind: 'hidden' };
  }

  const percent = Math.round(((current - average) / average) * 100);

  if (percent === 0) {
    return {
      kind: 'flat',
      average: averageData.average,
      monthLabels: averageData.monthLabels,
    };
  }

  return {
    kind: percent > 0 ? 'up' : 'down',
    percent: Math.abs(percent),
    average: averageData.average,
    monthLabels: averageData.monthLabels,
  };
}
