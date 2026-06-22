export function formatTransactionValueForKey(value: number): string {
  return value.toFixed(2);
}

export function getCalendarDayKey(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDuplicateKey(
  date: Date | string,
  value: number,
  bankAccountId: string,
): string {
  return `${getCalendarDayKey(date)}|${formatTransactionValueForKey(value)}|${bankAccountId}`;
}
