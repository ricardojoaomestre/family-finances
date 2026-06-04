import { normalizeToReportMonth } from '@/lib/reports/report-month';

export type ValidReportDateRange = {
  ok: true;
  dateFrom: string;
  dateTo: string;
};

export type InvalidReportDateRange = {
  ok: false;
  message: string;
};

export type ReportDateRangeValidation =
  | ValidReportDateRange
  | InvalidReportDateRange;

export const REPORT_MONTH_REQUIRED_MESSAGE = 'Select a month.';

export function validateReportDateRange(
  dateFrom: string,
  dateTo: string,
): ReportDateRangeValidation {
  if (!dateFrom || !dateTo) {
    return {
      ok: false,
      message: REPORT_MONTH_REQUIRED_MESSAGE,
    };
  }

  const normalized = normalizeToReportMonth(dateFrom);

  if (!normalized) {
    return {
      ok: false,
      message: 'Enter a valid month.',
    };
  }

  return { ok: true, ...normalized };
}
