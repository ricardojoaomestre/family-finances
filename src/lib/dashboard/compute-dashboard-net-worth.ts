export function computeDashboardNetWorth(
  income: string,
  expenses: string,
): string {
  const net = Number(income) + Number(expenses);
  return net.toFixed(2);
}

export function formatDashboardExpenseTotal(expenses: string): string {
  return formatDashboardMagnitudeTotal(expenses);
}

export function formatDashboardMagnitudeTotal(value: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return Math.abs(amount).toFixed(2);
}
