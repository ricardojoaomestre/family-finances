import {
  formatCalendarDayKey,
  parseCalendarDayKey,
} from '@/lib/dates/calendar-day-key';

const reportMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
});

const priorMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
});

export function getReportMonthBounds(
  year: number,
  month: number,
): { dateFrom: string; dateTo: string } {
  const dateFrom = formatCalendarDayKey(new Date(year, month - 1, 1));
  const dateTo = formatCalendarDayKey(new Date(year, month, 0));

  return { dateFrom, dateTo };
}

export function normalizeToReportMonth(
  dateFrom: string,
): { dateFrom: string; dateTo: string } | null {
  const parsed = parseCalendarDayKey(dateFrom);

  if (!parsed) {
    return null;
  }

  return getReportMonthBounds(
    parsed.getFullYear(),
    parsed.getMonth() + 1,
  );
}

export function formatReportMonth(dateFrom: string): string {
  const parsed = parseCalendarDayKey(dateFrom);

  if (!parsed) {
    return dateFrom;
  }

  return reportMonthFormatter.format(parsed);
}

export function formatPriorMonthLabels(monthIndexes: number[]): string {
  if (monthIndexes.length === 0) {
    return '';
  }

  const sorted = [...monthIndexes].sort((a, b) => a - b);
  const isConsecutive = sorted.every(
    (monthIndex, index) => index === 0 || monthIndex === sorted[index - 1] + 1,
  );

  const formatMonth = (monthIndex: number) =>
    priorMonthFormatter.format(new Date(2024, monthIndex, 1));

  if (sorted.length === 1) {
    return formatMonth(sorted[0]);
  }

  if (isConsecutive) {
    return `${formatMonth(sorted[0])}–${formatMonth(sorted[sorted.length - 1])}`;
  }

  return sorted.map(formatMonth).join(', ');
}

export function getPreviousCalendarMonthRange(
  reportDateFrom: string,
): { dateFrom: string; dateTo: string } | null {
  const parsed = parseCalendarDayKey(reportDateFrom);

  if (!parsed) {
    return null;
  }

  const previousMonth = new Date(
    parsed.getFullYear(),
    parsed.getMonth() - 1,
    1,
  );

  return getReportMonthBounds(
    previousMonth.getFullYear(),
    previousMonth.getMonth() + 1,
  );
}

export function formatPreviousCalendarMonth(reportDateFrom: string): string | null {
  const range = getPreviousCalendarMonthRange(reportDateFrom);

  if (!range) {
    return null;
  }

  return formatReportMonth(range.dateFrom);
}

export function getPriorReportMonthRange(
  reportDateFrom: string,
): { dateFrom: string; dateTo: string } | null {
  const parsed = parseCalendarDayKey(reportDateFrom);

  if (!parsed) {
    return null;
  }

  const year = parsed.getFullYear();
  const reportMonthIndex = parsed.getMonth();

  if (reportMonthIndex === 0) {
    return null;
  }

  return {
    dateFrom: formatCalendarDayKey(new Date(year, 0, 1)),
    dateTo: formatCalendarDayKey(new Date(year, reportMonthIndex, 0)),
  };
}
