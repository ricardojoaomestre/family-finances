import { computeDashboardNetWorth } from '@/lib/dashboard/compute-dashboard-net-worth';
import type { DashboardMonthStats } from '@/lib/dashboard/dashboard-month-stats';
import { groupMonthReportCategoryTotals } from '@/lib/reports/group-month-report-category-totals';
import { getMonthReportCategoryTotals } from '@/lib/reports/get-month-report-category-totals';
import { getPreviousCalendarMonthRange } from '@/lib/reports/report-month';
import { sumCategoryTotals } from '@/lib/reports/sum-category-totals';

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

  const currentGrouped = groupMonthReportCategoryTotals(currentTotals);
  const income = sumCategoryTotals(currentGrouped.income);
  const expenses = sumCategoryTotals(currentGrouped.spending);
  const netWorth = computeDashboardNetWorth(income, expenses);

  if (!previousRange) {
    return {
      income,
      expenses,
      netWorth,
      previousMonth: null,
    };
  }

  const previousGrouped = groupMonthReportCategoryTotals(previousTotals);
  const previousIncome = sumCategoryTotals(previousGrouped.income);
  const previousExpenses = sumCategoryTotals(previousGrouped.spending);

  return {
    income,
    expenses,
    netWorth,
    previousMonth: {
      income: previousIncome,
      expenses: previousExpenses,
      netWorth: computeDashboardNetWorth(previousIncome, previousExpenses),
    },
  };
}
