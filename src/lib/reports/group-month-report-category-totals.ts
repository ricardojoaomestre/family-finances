import type { CategoryType } from '@/lib/categories/category-type';
import { resolveCategoryType } from '@/lib/categories/category-type';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

export const monthReportCategoryTableTypes = [
  'spending',
  'saving',
  'transfer',
] as const;

export type MonthReportCategoryTableType =
  (typeof monthReportCategoryTableTypes)[number];

export type MonthReportCategoryTotalsByTable = Record<
  MonthReportCategoryTableType,
  MonthReportCategoryTotal[]
>;

export function groupMonthReportCategoryTotals(
  rows: MonthReportCategoryTotal[],
): MonthReportCategoryTotalsByTable {
  const grouped: MonthReportCategoryTotalsByTable = {
    spending: [],
    saving: [],
    transfer: [],
  };

  for (const row of rows) {
    const type = resolveCategoryType(row.type);

    if (isMonthReportCategoryTableType(type)) {
      grouped[type].push(row);
    }
  }

  return grouped;
}

function isMonthReportCategoryTableType(
  type: CategoryType,
): type is MonthReportCategoryTableType {
  return (monthReportCategoryTableTypes as readonly CategoryType[]).includes(
    type,
  );
}

export function hasMonthReportCategoryTotals(
  grouped: MonthReportCategoryTotalsByTable,
): boolean {
  return monthReportCategoryTableTypes.some(
    (type) => grouped[type].length > 0,
  );
}
