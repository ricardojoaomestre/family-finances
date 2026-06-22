import { computeDashboardNetWorth } from '@/lib/dashboard/compute-dashboard-net-worth';
import type { DashboardMonthStats } from '@/lib/dashboard/dashboard-month-stats';
import { findSpendingCategoryDeltas } from '@/lib/dashboard/find-spending-category-deltas';
import { findTopSpendingCategory } from '@/lib/dashboard/find-top-spending-category';
import { groupMonthReportCategoryTotals } from '@/lib/reports/group-month-report-category-totals';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import { getPreviousCalendarMonthRange } from '@/lib/reports/report-month';
import { sumCategoryTotals } from '@/lib/reports/sum-category-totals';

export function buildDashboardMonthStats(
  dateFrom: string,
  currentTotals: MonthReportCategoryTotal[],
  previousTotals: MonthReportCategoryTotal[] | null,
): DashboardMonthStats {
  const previousRange = getPreviousCalendarMonthRange(dateFrom);
  const currentGrouped = groupMonthReportCategoryTotals(currentTotals);
  const income = sumCategoryTotals(currentGrouped.income);
  const expenses = sumCategoryTotals(currentGrouped.spending);
  const netWorth = computeDashboardNetWorth(income, expenses);
  const previousGrouped = previousTotals
    ? groupMonthReportCategoryTotals(previousTotals)
    : null;
  const topSpendingCategory = findTopSpendingCategory(currentGrouped.spending);
  const spendingCategoryDeltas = previousGrouped
    ? findSpendingCategoryDeltas(
        currentGrouped.spending,
        previousGrouped.spending,
      )
    : null;

  if (!previousRange || !previousGrouped) {
    return {
      income,
      expenses,
      netWorth,
      topSpendingCategory,
      spendingCategoryDeltas,
      previousMonth: null,
    };
  }

  const previousIncome = sumCategoryTotals(previousGrouped.income);
  const previousExpenses = sumCategoryTotals(previousGrouped.spending);

  return {
    income,
    expenses,
    netWorth,
    topSpendingCategory,
    spendingCategoryDeltas,
    previousMonth: {
      income: previousIncome,
      expenses: previousExpenses,
      netWorth: computeDashboardNetWorth(previousIncome, previousExpenses),
    },
  };
}
