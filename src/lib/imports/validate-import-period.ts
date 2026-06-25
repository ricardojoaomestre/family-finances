import type { ImportSource } from '@/db/schema';
import { parseCalendarDayKey } from '@/lib/dates/calendar-day-key';

export type ImportPeriodInput = {
  dateFrom: string;
  dateTo: string;
};

export function validateImportPeriod(
  input: ImportPeriodInput,
): { ok: true; dateFrom: string; dateTo: string } | { ok: false; error: string } {
  const dateFrom = input.dateFrom.trim();
  const dateTo = input.dateTo.trim();

  if (!dateFrom || !dateTo) {
    return { ok: false, error: 'Start and end dates are required.' };
  }

  if (!parseCalendarDayKey(dateFrom) || !parseCalendarDayKey(dateTo)) {
    return { ok: false, error: 'Dates must use YYYY-MM-DD format.' };
  }

  if (dateFrom > dateTo) {
    return { ok: false, error: 'Start date must be on or before end date.' };
  }

  return { ok: true, dateFrom, dateTo };
}

export function isApiImportConfirmInput(input: {
  source?: ImportSource;
}): boolean {
  return input.source === 'api';
}
