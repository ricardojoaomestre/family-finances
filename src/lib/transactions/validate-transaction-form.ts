import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';
import { parseLocalizedNumber } from '@/lib/file-import/parse-localized-number';
import { isMerchantSlug, type MerchantSlug } from '@/lib/merchants';

export const UNCATEGORIZED_CATEGORY_VALUE = '__none__';

export type TransactionFormInput = {
  id: string;
  date: string;
  description: string;
  value: string;
  categoryId: string | null;
  merchant: MerchantSlug;
};

export type TransactionFormField =
  | 'date'
  | 'description'
  | 'value'
  | 'categoryId'
  | 'merchant';

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

function parseTransactionDate(dateStr: string): Date | null {
  if (!DATE_INPUT_RE.test(dateStr)) {
    return null;
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || getCalendarDayKey(date) !== dateStr) {
    return null;
  }

  return date;
}

export function isTransactionId(value: string): boolean {
  return isUuid(value);
}

export function validateTransactionForm(
  input: TransactionFormInput,
): Partial<Record<TransactionFormField, string>> {
  const fieldErrors: Partial<Record<TransactionFormField, string>> = {};

  const date = parseTransactionDate(input.date.trim());

  if (!date) {
    fieldErrors.date = 'Enter a valid date.';
  } else if (date > endOfTodayUtc()) {
    fieldErrors.date = 'Date cannot be in the future.';
  }

  const description = input.description.trim();

  if (!description) {
    fieldErrors.description = 'Description is required.';
  }

  const value = parseLocalizedNumber(input.value.trim());

  if (value === null || !Number.isFinite(value)) {
    fieldErrors.value = 'Enter a valid amount.';
  }

  if (input.categoryId !== null && !isUuid(input.categoryId)) {
    fieldErrors.categoryId = 'Select a valid category.';
  }

  if (!isMerchantSlug(input.merchant)) {
    fieldErrors.merchant = 'Select a valid merchant.';
  }

  return fieldErrors;
}

export function parseValidatedTransactionForm(input: TransactionFormInput): {
  date: Date;
  description: string;
  value: number;
  categoryId: string | null;
  merchant: MerchantSlug;
} | null {
  const fieldErrors = validateTransactionForm(input);

  if (Object.keys(fieldErrors).length > 0) {
    return null;
  }

  const date = parseTransactionDate(input.date.trim());
  const value = parseLocalizedNumber(input.value.trim());

  if (!date || value === null) {
    return null;
  }

  return {
    date,
    description: input.description.trim(),
    value,
    categoryId: input.categoryId,
    merchant: input.merchant,
  };
}
