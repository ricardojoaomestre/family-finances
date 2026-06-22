import { describe, expect, it } from 'vitest';

import {
  computeCategoryBudgetUsage,
  getBudgetProgressValue,
} from '@/lib/budgets/compute-category-budget-usage';

describe('computeCategoryBudgetUsage', () => {
  it('computes usage from negative spending totals', () => {
    expect(computeCategoryBudgetUsage('500.00', '-250.50')).toEqual({
      spentAmount: '250.50',
      percentUsed: 50,
      isOverBudget: false,
    });
  });

  it('flags over-budget spending', () => {
    expect(computeCategoryBudgetUsage('100.00', '-150.00')).toEqual({
      spentAmount: '150.00',
      percentUsed: 150,
      isOverBudget: true,
    });
  });

  it('returns zero usage for invalid budgets', () => {
    expect(computeCategoryBudgetUsage('0', '-50.00')).toEqual({
      spentAmount: '50.00',
      percentUsed: 0,
      isOverBudget: false,
    });
  });
});

describe('getBudgetProgressValue', () => {
  it('caps the progress bar at 100', () => {
    expect(getBudgetProgressValue(150)).toBe(100);
    expect(getBudgetProgressValue(40)).toBe(40);
    expect(getBudgetProgressValue(-5)).toBe(0);
  });
});
