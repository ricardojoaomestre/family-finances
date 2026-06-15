import type { MonthOverMonthTrend } from '@/lib/dashboard/compute-month-over-month-trend';

export type DashboardTopSpendingCategory = {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  total: string;
};

export type DashboardSpendingCategoryDelta = {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  currentTotal: string;
  previousTotal: string;
  trend: MonthOverMonthTrend;
};

export type DashboardSpendingCategoryDeltas = {
  increase: DashboardSpendingCategoryDelta | null;
  decrease: DashboardSpendingCategoryDelta | null;
};

export type DashboardMonthStats = {
  income: string;
  expenses: string;
  netWorth: string;
  topSpendingCategory: DashboardTopSpendingCategory | null;
  spendingCategoryDeltas: DashboardSpendingCategoryDeltas | null;
  previousMonth: {
    income: string;
    expenses: string;
    netWorth: string;
  } | null;
};
