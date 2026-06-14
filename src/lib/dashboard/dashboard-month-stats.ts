export type DashboardTopSpendingCategory = {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  total: string;
};

export type DashboardMonthStats = {
  income: string;
  expenses: string;
  netWorth: string;
  topSpendingCategory: DashboardTopSpendingCategory | null;
  previousMonth: {
    income: string;
    expenses: string;
    netWorth: string;
  } | null;
};
