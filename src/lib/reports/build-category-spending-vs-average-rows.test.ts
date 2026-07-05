import { describe, expect, it } from 'vitest';

import {
  buildCategorySpendingVsAverageRows,
  computeCategorySpendingVsAverage,
  getCategorySpendingVsAverageSummary,
  resolveCategorySpendingComparisonStatus,
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
      differenceAmount: '0.00',
      percentOverAverage: 0,
      comparisonStatus: 'on-track',
      percentOfAverage: 100,
      isOverAverage: false,
      hasBaseline: true,
    });
    expect(rows[0]?.averageContext.priorMonths).toEqual([
      {
        monthDateFrom: '2026-01-01',
        monthLabel: expect.any(String),
        amount: '400.00',
      },
    ]);
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
    expect(rows[0]?.averageContext.priorMonths).toHaveLength(2);
  });

  it('marks categories with no prior spending as having no baseline', () => {
    const rows = buildCategorySpendingVsAverageRows(
      [spendingTotal({ total: '-120.00' })],
      [],
    );

    expect(rows[0]?.usage).toMatchObject({
      averageAmount: null,
      differenceAmount: null,
      percentOverAverage: null,
      comparisonStatus: 'no-baseline',
      hasBaseline: false,
      isOverAverage: false,
    });
    expect(rows[0]?.averageContext.priorMonths).toEqual([]);
  });
});

describe('computeCategorySpendingVsAverage', () => {
  it('flags spending above the average', () => {
    expect(computeCategorySpendingVsAverage('-500.00', 400)).toMatchObject({
      differenceAmount: '100.00',
      percentOverAverage: 25,
      comparisonStatus: 'over',
      percentOfAverage: 125,
      isOverAverage: true,
      hasBaseline: true,
    });
  });

  it('treats small differences as on track', () => {
    expect(computeCategorySpendingVsAverage('-416.00', 400)).toMatchObject({
      differenceAmount: '16.00',
      percentOverAverage: 4,
      comparisonStatus: 'on-track',
      isOverAverage: false,
    });
  });

  it('flags spending below the average', () => {
    expect(computeCategorySpendingVsAverage('-300.00', 400)).toMatchObject({
      differenceAmount: '-100.00',
      percentOverAverage: -25,
      comparisonStatus: 'under',
      isOverAverage: false,
    });
  });
});

describe('resolveCategorySpendingComparisonStatus', () => {
  it('returns on-track within the threshold', () => {
    expect(resolveCategorySpendingComparisonStatus(4)).toBe('on-track');
    expect(resolveCategorySpendingComparisonStatus(-4)).toBe('on-track');
  });

  it('returns over or under outside the threshold', () => {
    expect(resolveCategorySpendingComparisonStatus(6)).toBe('over');
    expect(resolveCategorySpendingComparisonStatus(-6)).toBe('under');
  });
});

describe('getCategorySpendingVsAverageSummary', () => {
  it('sums only categories materially over average', () => {
    const rows = buildCategorySpendingVsAverageRows(
      [
        spendingTotal({ total: '-500.00' }),
        spendingTotal({
          categoryId: 'cat-2',
          categoryName: 'Restaurants',
          total: '-300.00',
        }),
      ],
      [
        {
          categoryId: 'cat-1',
          monthDateFrom: '2026-01-01',
          total: '-400.00',
        },
        {
          categoryId: 'cat-2',
          monthDateFrom: '2026-01-01',
          total: '-400.00',
        },
      ],
    );

    expect(getCategorySpendingVsAverageSummary(rows)).toEqual({
      categoriesOverAverage: 1,
      totalCategories: 2,
      totalOverAverage: '100.00',
    });
  });
});
