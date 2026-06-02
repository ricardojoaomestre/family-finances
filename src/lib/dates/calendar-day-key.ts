const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/;

function getLocalCalendarDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseCalendarDayKey(value: string): Date | undefined {
  const trimmed = value.trim();

  if (!trimmed || !DATE_INPUT_RE.test(trimmed)) {
    return undefined;
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime()) || getLocalCalendarDayKey(date) !== trimmed) {
    return undefined;
  }

  return date;
}

export function formatCalendarDayKey(date: Date | undefined): string {
  if (!date) {
    return '';
  }

  return getLocalCalendarDayKey(date);
}

export function endOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
}
