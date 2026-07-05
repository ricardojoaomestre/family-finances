import { parseCalendarDayKey } from '@/lib/dates/calendar-day-key';
import { getReportMonthBounds } from '@/lib/reports/report-month';

export const SPENDING_VS_AVERAGE_PRIOR_MONTHS = 6;

export type SpendingVsAverageMonthRange = {
  monthDateFrom: string;
  dateFrom: string;
  dateTo: string;
};

export function getSpendingVsAveragePriorMonthRanges(
  reportDateFrom: string,
  priorMonths = SPENDING_VS_AVERAGE_PRIOR_MONTHS,
): SpendingVsAverageMonthRange[] {
  const parsed = parseCalendarDayKey(reportDateFrom);

  if (!parsed) {
    return [];
  }

  const ranges: SpendingVsAverageMonthRange[] = [];

  for (let offset = priorMonths; offset >= 1; offset -= 1) {
    const monthStart = new Date(
      parsed.getFullYear(),
      parsed.getMonth() - offset,
      1,
    );
    const bounds = getReportMonthBounds(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
    );

    ranges.push({
      monthDateFrom: bounds.dateFrom,
      dateFrom: bounds.dateFrom,
      dateTo: bounds.dateTo,
    });
  }

  return ranges;
}
