import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';

const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCalendarDayKey(value: string): Date | undefined {
  const trimmed = value.trim();

  if (!trimmed || !DATE_INPUT_RE.test(trimmed)) {
    return undefined;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || getCalendarDayKey(date) !== trimmed) {
    return undefined;
  }

  return date;
}

export function formatCalendarDayKey(date: Date | undefined): string {
  if (!date) {
    return '';
  }

  return getCalendarDayKey(date);
}

export function endOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}
