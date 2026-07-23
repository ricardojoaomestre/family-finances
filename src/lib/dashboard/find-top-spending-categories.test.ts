import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_TOP_SPENDING_CATEGORIES_LIMIT,
  findTopSpendingCategories,
} from '@/lib/dashboard/find-top-spending-categories';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

function spendingRow(
  overrides: Partial<MonthReportCategoryTotal> &
    Pick<MonthReportCategoryTotal, 'categoryId' | 'categoryName' | 'total'>,
): MonthReportCategoryTotal {
  return {
    categoryColor: 'sky-200',
    categoryIcon: null,
    type: 'spending',
    ...overrides,
  };
}

describe('findTopSpendingCategories', () => {
  it('returns the highest absolute spending categories first', () => {
    const result = findTopSpendingCategories([
      spendingRow({
        categoryId: 'a',
        categoryName: 'Groceries',
        total: '-120.00',
      }),
      spendingRow({
        categoryId: 'b',
        categoryName: 'Travel',
        total: '-500.50',
        categoryColor: 'orange-300',
      }),
      spendingRow({
        categoryId: 'c',
        categoryName: 'Coffee',
        total: '-40.00',
      }),
    ]);

    expect(result.map((row) => row.categoryName)).toEqual([
      'Travel',
      'Groceries',
      'Coffee',
    ]);
    expect(result[0]).toMatchObject({
      key: 'b',
      amount: '500.50',
      categoryColor: 'orange-300',
    });
  });

  it('limits results to the configured top count', () => {
    const spending = Array.from({ length: 12 }, (_, index) =>
      spendingRow({
        categoryId: `c-${index}`,
        categoryName: `Category ${index}`,
        total: `-${index + 1}.00`,
      }),
    );

    const result = findTopSpendingCategories(spending);

    expect(result).toHaveLength(DASHBOARD_TOP_SPENDING_CATEGORIES_LIMIT);
    expect(result[0]?.amount).toBe('12.00');
    expect(result[9]?.amount).toBe('3.00');
  });

  it('skips zero or invalid totals and labels missing categories', () => {
    const result = findTopSpendingCategories([
      spendingRow({
        categoryId: null,
        categoryName: null,
        total: '-25.00',
        categoryColor: null,
      }),
      spendingRow({
        categoryId: 'zero',
        categoryName: 'Zero',
        total: '0',
      }),
      spendingRow({
        categoryId: 'bad',
        categoryName: 'Bad',
        total: 'not-a-number',
      }),
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        key: 'uncategorized',
        categoryId: null,
        categoryName: 'Uncategorized',
        amount: '25.00',
      }),
    ]);
  });
});
