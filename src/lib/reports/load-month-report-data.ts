import { getBankAccounts } from '@/lib/bank-accounts/get-bank-accounts';
import { getCategories } from '@/lib/categories/get-categories';
import type { CategorySelectorItem } from '@/lib/categories/filter-category-selector-items';
import { toCategorySelectorItems } from '@/lib/categories/to-category-selector-items';
import {
  toCategoryOptions,
  type CategoryOption,
} from '@/lib/categories/to-category-options';
import type { CategorySpendingVsAverageRow } from '@/lib/reports/build-category-spending-vs-average-rows';
import { getCategorySpendingVsAverageRows } from '@/lib/reports/get-category-spending-vs-average-rows';
import { getMonthReportPrimaryAccountBalanceBeforeIncome } from '@/lib/reports/get-month-report-primary-account-balance-before-income';
import {
  getMonthReportCategoryTotals,
  type MonthReportCategoryTotal,
} from '@/lib/reports/get-month-report-category-totals';
import { countUncategorizedTransactionsForPeriod } from '@/lib/reports/get-uncategorized-transactions-for-period';

export type MonthReportData = {
  categoryTotals: MonthReportCategoryTotal[];
  categories: CategoryOption[];
  categorySelectorItems: CategorySelectorItem[];
  bankAccounts: Array<{ id: string; label: string }>;
  primaryAccountBalanceBeforeIncome: string | null;
  spendingVsAverage: CategorySpendingVsAverageRow[];
  uncategorizedCount: number;
};

export async function loadMonthReportData(
  dateFrom: string,
  dateTo: string,
): Promise<MonthReportData> {
  const [
    categoryTotals,
    categoryRows,
    bankAccountRows,
    primaryAccountBalanceBeforeIncome,
    uncategorizedCount,
  ] = await Promise.all([
    getMonthReportCategoryTotals(dateFrom, dateTo),
    getCategories(),
    getBankAccounts(),
    getMonthReportPrimaryAccountBalanceBeforeIncome(dateFrom, dateTo),
    countUncategorizedTransactionsForPeriod(dateFrom, dateTo),
  ]);

  const spendingVsAverage = await getCategorySpendingVsAverageRows(
    dateFrom,
    categoryTotals,
  );

  return {
    categoryTotals,
    categories: toCategoryOptions(categoryRows),
    categorySelectorItems: toCategorySelectorItems(categoryRows),
    bankAccounts: bankAccountRows.map((account) => ({
      id: account.id,
      label: account.label,
    })),
    primaryAccountBalanceBeforeIncome,
    spendingVsAverage,
    uncategorizedCount,
  };
}
