import type { ImportDateFormat } from './merchant-profiles';

function parseDmyString(value: string): string | null {
  const match = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!match) return null;

  const day = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  let year = Number.parseInt(match[3]!, 10);

  if (year < 100) {
    year += 2000;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year
  ) {
    return null;
  }

  return date.toISOString();
}

function parseYmdString(value: string): string | null {
  const match = value.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year
  ) {
    return null;
  }

  return date.toISOString();
}

export function parseImportDate(
  value: unknown,
  format: ImportDateFormat,
): string | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (format === 'DMY' || format === 'auto') {
    const dmy = parseDmyString(normalized);
    if (dmy) return dmy;
  }

  if (format === 'YMD' || format === 'auto') {
    const ymd = parseYmdString(normalized);
    if (ymd) return ymd;
  }

  if (format === 'auto') {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return null;
}
