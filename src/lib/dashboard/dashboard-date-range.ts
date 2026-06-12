import { subDays, subMonths } from 'date-fns';

import { formatCalendarDayKey } from '@/lib/dates/calendar-day-key';

export const DASHBOARD_DATE_RANGE_PRESETS = [
  { id: '1d', label: '1 day' },
  { id: '7d', label: '7 days' },
  { id: '15d', label: '15 days' },
  { id: '1m', label: '1 month' },
  { id: '3m', label: '3 months' },
] as const;

export type DashboardDateRangePreset =
  (typeof DASHBOARD_DATE_RANGE_PRESETS)[number]['id'];

export const DEFAULT_DASHBOARD_DATE_RANGE_PRESET: DashboardDateRangePreset =
  '1m';

export type DashboardDateRange = {
  preset: DashboardDateRangePreset;
  dateFrom: string;
  dateTo: string;
};

export function getDashboardDateRangePresetLabel(
  preset: DashboardDateRangePreset,
): string {
  return (
    DASHBOARD_DATE_RANGE_PRESETS.find((item) => item.id === preset)?.label ??
    preset
  );
}

export function getDashboardDateRange(
  preset: DashboardDateRangePreset,
  referenceDate: Date = new Date(),
): Pick<DashboardDateRange, 'dateFrom' | 'dateTo'> {
  const dateTo = formatCalendarDayKey(referenceDate);

  let dateFrom: Date;

  switch (preset) {
    case '1d':
      dateFrom = subDays(referenceDate, 0);
      break;
    case '7d':
      dateFrom = subDays(referenceDate, 6);
      break;
    case '15d':
      dateFrom = subDays(referenceDate, 14);
      break;
    case '1m':
      dateFrom = subMonths(referenceDate, 1);
      break;
    case '3m':
      dateFrom = subMonths(referenceDate, 3);
      break;
  }

  return {
    dateFrom: formatCalendarDayKey(dateFrom),
    dateTo,
  };
}
