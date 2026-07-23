import type { CategoryColorToken } from '@/lib/categories/category-colors';

export type DashboardTopSpendingCategory = {
  key: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: CategoryColorToken;
  amount: string;
};

export type DashboardMonthStats = {
  income: string;
  expenses: string;
  netWorth: string;
  previousMonth: {
    income: string;
    expenses: string;
    netWorth: string;
  } | null;
  topSpendingCategories: DashboardTopSpendingCategory[];
};
