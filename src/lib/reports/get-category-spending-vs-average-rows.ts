import { buildCategorySpendingVsAverageRows } from '@/lib/reports/build-category-spending-vs-average-rows';
import { getCategoryPriorMonthlySpending } from '@/lib/reports/get-category-prior-monthly-spending';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import { groupMonthReportCategoryTotals } from '@/lib/reports/group-month-report-category-totals';

export async function getCategorySpendingVsAverageRows(
  reportDateFrom: string,
  currentTotals: MonthReportCategoryTotal[],
) {
  const priorMonthlySpending =
    await getCategoryPriorMonthlySpending(reportDateFrom);

  const currentSpendingTotals =
    groupMonthReportCategoryTotals(currentTotals).spending;

  return buildCategorySpendingVsAverageRows(
    currentSpendingTotals,
    priorMonthlySpending,
  );
}
