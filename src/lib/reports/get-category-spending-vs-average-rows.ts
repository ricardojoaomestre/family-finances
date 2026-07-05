import { buildCategorySpendingVsAverageRows } from '@/lib/reports/build-category-spending-vs-average-rows';
import { getCategoryPriorMonthlySpending } from '@/lib/reports/get-category-prior-monthly-spending';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import { groupMonthReportCategoryTotals } from '@/lib/reports/group-month-report-category-totals';
import { getSpendingVsAveragePriorMonthRanges } from '@/lib/reports/spending-vs-average-months';

export async function getCategorySpendingVsAverageRows(
  reportDateFrom: string,
  currentTotals: MonthReportCategoryTotal[],
) {
  const priorMonthlySpending =
    await getCategoryPriorMonthlySpending(reportDateFrom);
  const monthRanges = getSpendingVsAveragePriorMonthRanges(reportDateFrom);

  const currentSpendingTotals =
    groupMonthReportCategoryTotals(currentTotals).spending;

  return buildCategorySpendingVsAverageRows(
    currentSpendingTotals,
    priorMonthlySpending,
    monthRanges,
  );
}
