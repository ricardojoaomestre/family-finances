import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

export function sumCategoryTotals(rows: MonthReportCategoryTotal[]): string {
  const total = rows.reduce((sum, row) => sum + Number(row.total), 0);
  return total.toFixed(2);
}
