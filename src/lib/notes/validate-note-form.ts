import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';
import { parseLocalizedNumber } from '@/lib/file-import/parse-localized-number';

import {
  isNoteEligibleCategoryType,
  normalizeNoteValueFromPositiveAmount,
} from './normalize-note-value';
import type { NoteFormField, NoteFormInput } from './types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

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

function parseNoteDate(dateStr: string): Date | null {
  if (!DATE_INPUT_RE.test(dateStr)) {
    return null;
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || getCalendarDayKey(date) !== dateStr) {
    return null;
  }

  return date;
}

export function validateNoteForm(
  input: NoteFormInput,
  options: {
    categoryType?: 'spending' | 'income' | null;
  } = {},
): Partial<Record<NoteFormField, string>> {
  const fieldErrors: Partial<Record<NoteFormField, string>> = {};

  if (!isUuid(input.bankAccountId)) {
    fieldErrors.bankAccountId = 'Select a valid account.';
  }

  const date = parseNoteDate(input.date.trim());

  if (!date) {
    fieldErrors.date = 'Enter a valid date.';
  } else if (date > endOfTodayUtc()) {
    fieldErrors.date = 'Date cannot be in the future.';
  }

  const amount = parseLocalizedNumber(input.amount.trim());

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    fieldErrors.amount = 'Enter a valid positive amount.';
  }

  if (!isUuid(input.categoryId)) {
    fieldErrors.categoryId = 'Select a valid category.';
  } else if (
    options.categoryType !== undefined &&
    options.categoryType !== null &&
    !isNoteEligibleCategoryType(options.categoryType)
  ) {
    fieldErrors.categoryId = 'Select a spending or income category.';
  }

  const context = input.context.trim();

  if (context.length > 500) {
    fieldErrors.context = 'Context must be 500 characters or fewer.';
  }

  return fieldErrors;
}

export function parseValidatedNoteForm(
  input: NoteFormInput,
  categoryType: 'spending' | 'income',
): {
  bankAccountId: string;
  date: Date;
  value: number;
  categoryId: string;
  context: string | null;
} | null {
  const fieldErrors = validateNoteForm(input, { categoryType });

  if (Object.keys(fieldErrors).length > 0) {
    return null;
  }

  const date = parseNoteDate(input.date.trim());
  const amount = parseLocalizedNumber(input.amount.trim());

  if (!date || amount === null || !isUuid(input.bankAccountId)) {
    return null;
  }

  return {
    bankAccountId: input.bankAccountId,
    date,
    value: normalizeNoteValueFromPositiveAmount(amount, categoryType),
    categoryId: input.categoryId,
    context: input.context.trim() || null,
  };
}
