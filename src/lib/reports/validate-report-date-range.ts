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

export function validateReportDateRange(
  dateFrom: string,
  dateTo: string,
): ReportDateRangeValidation {
  if (!dateFrom || !dateTo) {
    return {
      ok: false,
      message: 'Start and end dates are required.',
    };
  }

  if (dateFrom > dateTo) {
    return {
      ok: false,
      message: 'Start date must be on or before end date.',
    };
  }

  return { ok: true, dateFrom, dateTo };
}
