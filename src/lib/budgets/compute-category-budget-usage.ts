export type CategoryBudgetUsage = {
  spentAmount: string;
  percentUsed: number;
  isOverBudget: boolean;
};

export function computeCategoryBudgetUsage(
  budgetAmount: string,
  spentTotal: string,
): CategoryBudgetUsage {
  const budget = Number(budgetAmount);
  const spent = Math.abs(Number(spentTotal));

  if (!Number.isFinite(budget) || budget <= 0 || !Number.isFinite(spent)) {
    return {
      spentAmount: Number.isFinite(spent) ? spent.toFixed(2) : '0.00',
      percentUsed: 0,
      isOverBudget: false,
    };
  }

  const percentUsed = Math.round((spent / budget) * 100);

  return {
    spentAmount: spent.toFixed(2),
    percentUsed,
    isOverBudget: spent > budget,
  };
}

export function getBudgetProgressValue(percentUsed: number): number {
  return Math.min(100, Math.max(0, percentUsed));
}
