import { getReportMonthBounds } from '@/lib/reports/report-month';

export type DashboardMonthRange = {
  dateFrom: string;
  dateTo: string;
};

export function getDefaultDashboardMonthRange(
  referenceDate: Date = new Date(),
): DashboardMonthRange {
  const previousMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - 1,
    1,
  );

  return getReportMonthBounds(
    previousMonth.getFullYear(),
    previousMonth.getMonth() + 1,
  );
}
