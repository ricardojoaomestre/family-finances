import { computeMonthOverMonthTrend } from '@/lib/dashboard/compute-month-over-month-trend';
import { formatDashboardMagnitudeTotal } from '@/lib/dashboard/compute-dashboard-net-worth';
import type {
  DashboardSpendingCategoryDelta,
  DashboardSpendingCategoryDeltas,
} from '@/lib/dashboard/dashboard-month-stats';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

type SpendingCategorySnapshot = {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  currentTotal: string;
  previousTotal: string;
};

export function findSpendingCategoryDeltas(
  currentSpendingRows: MonthReportCategoryTotal[],
  previousSpendingRows: MonthReportCategoryTotal[],
): DashboardSpendingCategoryDeltas {
  const snapshots = buildSpendingCategorySnapshots(
    currentSpendingRows,
    previousSpendingRows,
  );

  let biggestIncrease: DashboardSpendingCategoryDelta | null = null;
  let biggestIncreaseAmount = -1;
  let biggestDecrease: DashboardSpendingCategoryDelta | null = null;
  let biggestDecreaseAmount = -1;

  for (const snapshot of snapshots) {
    const currentTotal = formatDashboardMagnitudeTotal(snapshot.currentTotal);
    const previousTotal = formatDashboardMagnitudeTotal(snapshot.previousTotal);
    const delta = Number(currentTotal) - Number(previousTotal);

    if (!Number.isFinite(delta) || delta === 0) {
      continue;
    }

    const entry: DashboardSpendingCategoryDelta = {
      categoryId: snapshot.categoryId,
      categoryName: snapshot.categoryName,
      categoryColor: snapshot.categoryColor,
      categoryIcon: snapshot.categoryIcon,
      currentTotal,
      previousTotal,
      trend: computeMonthOverMonthTrend(currentTotal, previousTotal),
    };

    if (delta > 0 && delta > biggestIncreaseAmount) {
      biggestIncreaseAmount = delta;
      biggestIncrease = entry;
    }

    if (delta < 0 && Math.abs(delta) > biggestDecreaseAmount) {
      biggestDecreaseAmount = Math.abs(delta);
      biggestDecrease = entry;
    }
  }

  return {
    increase: biggestIncrease,
    decrease: biggestDecrease,
  };
}

function buildSpendingCategorySnapshots(
  currentSpendingRows: MonthReportCategoryTotal[],
  previousSpendingRows: MonthReportCategoryTotal[],
): SpendingCategorySnapshot[] {
  const byKey = new Map<
    string,
    {
      categoryId: string | null;
      categoryName: string;
      categoryColor: string | null;
      categoryIcon: string | null;
      currentTotal: string;
      previousTotal: string;
    }
  >();

  for (const row of currentSpendingRows) {
    const key = getSpendingCategoryKey(row.categoryId);

    byKey.set(key, {
      categoryId: row.categoryId,
      categoryName: row.categoryName ?? 'Uncategorized',
      categoryColor: row.categoryColor,
      categoryIcon: row.categoryIcon,
      currentTotal: row.total,
      previousTotal: '0',
    });
  }

  for (const row of previousSpendingRows) {
    const key = getSpendingCategoryKey(row.categoryId);
    const existing = byKey.get(key);

    if (existing) {
      existing.previousTotal = row.total;
      continue;
    }

    byKey.set(key, {
      categoryId: row.categoryId,
      categoryName: row.categoryName ?? 'Uncategorized',
      categoryColor: row.categoryColor,
      categoryIcon: row.categoryIcon,
      currentTotal: '0',
      previousTotal: row.total,
    });
  }

  return [...byKey.values()];
}

function getSpendingCategoryKey(categoryId: string | null): string {
  return categoryId ?? '__uncategorized__';
}
