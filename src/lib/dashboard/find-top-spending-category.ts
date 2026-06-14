import { formatDashboardMagnitudeTotal } from '@/lib/dashboard/compute-dashboard-net-worth';
import type { DashboardTopSpendingCategory } from '@/lib/dashboard/dashboard-month-stats';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

export function findTopSpendingCategory(
  spendingRows: MonthReportCategoryTotal[],
): DashboardTopSpendingCategory | null {
  const top = pickHighestSpendingRow(spendingRows);

  if (!top) {
    return null;
  }

  return {
    categoryId: top.categoryId,
    categoryName: top.categoryName ?? 'Uncategorized',
    categoryColor: top.categoryColor,
    categoryIcon: top.categoryIcon,
    total: formatDashboardMagnitudeTotal(top.total),
  };
}

function pickHighestSpendingRow(
  spendingRows: MonthReportCategoryTotal[],
): MonthReportCategoryTotal | null {
  let top: MonthReportCategoryTotal | null = null;
  let topAmount = -1;

  for (const row of spendingRows) {
    const amount = Math.abs(Number(row.total));

    if (!Number.isFinite(amount) || amount === 0) {
      continue;
    }

    if (amount > topAmount) {
      topAmount = amount;
      top = row;
    }
  }

  return top;
}
