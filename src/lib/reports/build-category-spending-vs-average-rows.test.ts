import { describe, expect, it } from 'vitest';

import {
  buildCategorySpendingVsAverageRows,
  computeCategorySpendingVsAverage,
} from '@/lib/reports/build-category-spending-vs-average-rows';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

function spendingTotal(
  overrides: Partial<MonthReportCategoryTotal> & Pick<MonthReportCategoryTotal, 'total'>,
): MonthReportCategoryTotal {
  return {
    categoryId: 'cat-1',
    categoryName: 'Groceries',
    categoryColor: 'green-200',
    categoryIcon: 'shopping-cart',
    type: 'spending',
    ...overrides,
  };
}

describe('buildCategorySpendingVsAverageRows', () => {
  it('averages only prior months that had spending', () => {
    const rows = buildCategorySpendingVsAverageRows(
      [spendingTotal({ total: '-400.00' })],
      [
        {
          categoryId: 'cat-1',
          monthDateFrom: '2026-01-01',
          total: '-400.00',
        },
      ],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.usage).toMatchObject({
      currentAmount: '400.00',
      averageAmount: '400.00',
      percentOfAverage: 100,
      isOverAverage: false,
      hasBaseline: true,
    });
  });

  it('ignores zero-spend prior months in the divisor', () => {
    const rows = buildCategorySpendingVsAverageRows(
      [spendingTotal({ total: '-400.00' })],
      [
        {
          categoryId: 'cat-1',
          monthDateFrom: '2026-01-01',
          total: '-200.00',
        },
        {
          categoryId: 'cat-1',
          monthDateFrom: '2026-02-01',
          total: '-600.00',
        },
      ],
    );

    expect(rows[0]?.usage.averageAmount).toBe('400.00');
    expect(rows[0]?.usage.percentOfAverage).toBe(100);
  });

  it('marks categories with no prior spending as having no baseline', () => {
    const rows = buildCategorySpendingVsAverageRows(
      [spendingTotal({ total: '-120.00' })],
      [],
    );

    expect(rows[0]?.usage).toMatchObject({
      averageAmount: null,
      hasBaseline: false,
      isOverAverage: false,
    });
  });
});

describe('computeCategorySpendingVsAverage', () => {
  it('flags spending above the average', () => {
    expect(computeCategorySpendingVsAverage('-500.00', 400)).toMatchObject({
      percentOfAverage: 125,
      isOverAverage: true,
      hasBaseline: true,
    });
  });
});
