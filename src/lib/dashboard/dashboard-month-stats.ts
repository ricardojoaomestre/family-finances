export type DashboardMonthStats = {
  income: string;
  expenses: string;
  netWorth: string;
  previousMonth: {
    income: string;
    expenses: string;
    netWorth: string;
  } | null;
};
