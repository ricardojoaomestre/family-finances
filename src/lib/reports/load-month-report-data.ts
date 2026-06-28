import { getBankAccounts } from '@/lib/bank-accounts/get-bank-accounts';
import { getCategories } from '@/lib/categories/get-categories';
import type { CategorySelectorItem } from '@/lib/categories/filter-category-selector-items';
import { toCategorySelectorItems } from '@/lib/categories/to-category-selector-items';
import {
  toCategoryOptions,
  type CategoryOption,
} from '@/lib/categories/to-category-options';
import { getMonthReportPrimaryAccountBalanceBeforeIncome } from '@/lib/reports/get-month-report-primary-account-balance-before-income';
import {
  getMonthReportCategoryTotals,
  type MonthReportCategoryTotal,
} from '@/lib/reports/get-month-report-category-totals';
import { countUncategorizedTransactionsForPeriod } from '@/lib/reports/get-uncategorized-transactions-for-period';
import {
  getSpendingCategoryMonthAverages,
  type SpendingCategoryAverage,
} from '@/lib/reports/get-spending-category-month-averages';

export type MonthReportData = {
  categoryTotals: MonthReportCategoryTotal[];
  categories: CategoryOption[];
  categorySelectorItems: CategorySelectorItem[];
  bankAccounts: Array<{ id: string; label: string }>;
  primaryAccountBalanceBeforeIncome: string | null;
  spendingCategoryAverages: Record<string, SpendingCategoryAverage>;
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
    spendingCategoryAverages,
    uncategorizedCount,
  ] = await Promise.all([
    getMonthReportCategoryTotals(dateFrom, dateTo),
    getCategories(),
    getBankAccounts(),
    getMonthReportPrimaryAccountBalanceBeforeIncome(dateFrom, dateTo),
    getSpendingCategoryMonthAverages(dateFrom),
    countUncategorizedTransactionsForPeriod(dateFrom, dateTo),
  ]);

  return {
    categoryTotals,
    categories: toCategoryOptions(categoryRows),
    categorySelectorItems: toCategorySelectorItems(categoryRows),
    bankAccounts: bankAccountRows.map((account) => ({
      id: account.id,
      label: account.label,
    })),
    primaryAccountBalanceBeforeIncome,
    spendingCategoryAverages,
    uncategorizedCount,
  };
}
