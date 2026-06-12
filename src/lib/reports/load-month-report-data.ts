import { getCategories } from '@/lib/categories/get-categories';
import {
  toCategoryOptions,
  type CategoryOption,
} from '@/lib/categories/to-category-options';
import { getMonthReportPrimaryAccountBalanceBeforeIncome } from '@/lib/reports/get-month-report-primary-account-balance-before-income';
import {
  getMonthReportCategoryTotals,
  type MonthReportCategoryTotal,
} from '@/lib/reports/get-month-report-category-totals';
import {
  getSpendingCategoryMonthAverages,
  type SpendingCategoryAverage,
} from '@/lib/reports/get-spending-category-month-averages';

export type MonthReportData = {
  categoryTotals: MonthReportCategoryTotal[];
  categories: CategoryOption[];
  primaryAccountBalanceBeforeIncome: string | null;
  spendingCategoryAverages: Record<string, SpendingCategoryAverage>;
};

export async function loadMonthReportData(
  dateFrom: string,
  dateTo: string,
): Promise<MonthReportData> {
  const [
    categoryTotals,
    categoryRows,
    primaryAccountBalanceBeforeIncome,
    spendingCategoryAverages,
  ] = await Promise.all([
    getMonthReportCategoryTotals(dateFrom, dateTo),
    getCategories(),
    getMonthReportPrimaryAccountBalanceBeforeIncome(dateFrom, dateTo),
    getSpendingCategoryMonthAverages(dateFrom),
  ]);

  return {
    categoryTotals,
    categories: toCategoryOptions(categoryRows),
    primaryAccountBalanceBeforeIncome,
    spendingCategoryAverages,
  };
}
