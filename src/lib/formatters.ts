const DISPLAY_LOCALE = 'en-GB';

const dateFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  dateStyle: 'medium',
});

const dateTimeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const moneyFormatter = new Intl.NumberFormat(DISPLAY_LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDisplayDate(value: Date | string | null) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDisplayDateTime(value: Date | string | null) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function formatDisplayMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return '—';
  return moneyFormatter.format(num);
}

export function invertMoneySign(
  value: string | number | null | undefined,
): string | number | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  const num = typeof value === 'string' ? Number(value) : value;

  if (!Number.isFinite(num)) {
    return value;
  }

  return (-num).toFixed(2);
}

export function formatImportStatus(status: string) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'partial':
      return 'Partial';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}
