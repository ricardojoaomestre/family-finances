import { getReportMonthBounds } from '@/lib/reports/report-month';

export type DashboardMonthRange = {
  dateFrom: string;
  dateTo: string;
};

export function getDefaultDashboardMonthRange(
  referenceDate: Date = new Date(),
): DashboardMonthRange {
  return getReportMonthBounds(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
  );
}
