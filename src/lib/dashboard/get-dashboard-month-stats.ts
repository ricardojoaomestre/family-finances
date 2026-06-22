import { getMonthReportCategoryTotals } from '@/lib/reports/get-month-report-category-totals';
import { getPreviousCalendarMonthRange } from '@/lib/reports/report-month';
import { buildDashboardMonthStats } from '@/lib/dashboard/build-dashboard-month-stats';
import type { DashboardMonthStats } from '@/lib/dashboard/dashboard-month-stats';

export async function getDashboardMonthStats(
  dateFrom: string,
  dateTo: string,
): Promise<DashboardMonthStats> {
  const previousRange = getPreviousCalendarMonthRange(dateFrom);

  const [currentTotals, previousTotals] = await Promise.all([
    getMonthReportCategoryTotals(dateFrom, dateTo),
    previousRange
      ? getMonthReportCategoryTotals(
          previousRange.dateFrom,
          previousRange.dateTo,
        )
      : Promise.resolve([]),
  ]);

  return buildDashboardMonthStats(
    dateFrom,
    currentTotals,
    previousRange ? previousTotals : null,
  );
}
