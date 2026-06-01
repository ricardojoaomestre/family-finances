import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';
import { parseLocalizedNumber } from '@/lib/file-import/parse-localized-number';
import type { ImportedSpreadsheetRow } from '@/lib/file-import/types';

const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SkippedImportRowFormInput = {
  date: string;
  description: string;
  value: string;
};

export type SkippedImportRowFormField = 'date' | 'description' | 'value';

function endOfTodayUtc(): Date {
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

function parseFormDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();

  if (!DATE_INPUT_RE.test(trimmed)) {
    return null;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || getCalendarDayKey(date) !== trimmed) {
    return null;
  }

  return date;
}

export function validateSkippedImportRowForm(
  input: SkippedImportRowFormInput,
): Partial<Record<SkippedImportRowFormField, string>> {
  const fieldErrors: Partial<Record<SkippedImportRowFormField, string>> = {};

  const date = parseFormDate(input.date);

  if (!date) {
    fieldErrors.date = 'Enter a valid date.';
  } else if (date > endOfTodayUtc()) {
    fieldErrors.date = 'Date cannot be in the future.';
  }

  if (!input.description.trim()) {
    fieldErrors.description = 'Description is required.';
  }

  const value = parseLocalizedNumber(input.value.trim());

  if (value === null || !Number.isFinite(value)) {
    fieldErrors.value = 'Enter a valid amount.';
  }

  return fieldErrors;
}

export function parseSkippedImportRowForm(
  input: SkippedImportRowFormInput,
): ImportedSpreadsheetRow | null {
  const fieldErrors = validateSkippedImportRowForm(input);

  if (Object.keys(fieldErrors).length > 0) {
    return null;
  }

  const date = parseFormDate(input.date);
  const value = parseLocalizedNumber(input.value.trim());

  if (!date || value === null) {
    return null;
  }

  return {
    date: getCalendarDayKey(date),
    description: input.description.trim(),
    value,
    categoryId: null,
  };
}
