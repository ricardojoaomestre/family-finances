import type { DetectedImportHeader } from './detect-import-header';
import type {
  ImportSignRule,
  MerchantImportProfile,
} from './merchant-profiles';
import { parseImportDate } from './parse-import-date';
import { parseLocalizedNumber } from './parse-localized-number';
import type { ImportedSpreadsheetRow } from './types';

const GLOBAL_SKIP_ROW_PATTERNS = [
  /^total\b/i,
  /^saldo anterior\b/i,
  /^saldo\b/i,
  /^movimentos\b/i,
];

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return parseLocalizedNumber(String(value));
}

function applySignRule(
  value: number,
  signRule: ImportSignRule,
): number {
  switch (signRule) {
    case 'debit-negative':
      return value > 0 ? -Math.abs(value) : value;
    case 'credit-positive':
      return value < 0 ? Math.abs(value) : value;
    case 'invert':
      return -value;
    case 'as-is':
    default:
      return value;
  }
}

function computeDebitCreditValue(
  debitRaw: unknown,
  creditRaw: unknown,
  signRule: ImportSignRule,
): number | null {
  const debit = toNullableNumber(debitRaw);
  const credit = toNullableNumber(creditRaw);

  if (debit === null && credit === null) {
    return null;
  }

  switch (signRule) {
    case 'debit-negative':
      if (debit !== null && credit === null) {
        return -Math.abs(debit);
      }
      if (credit !== null && debit === null) {
        return Math.abs(credit);
      }
      return Math.abs(credit ?? 0) - Math.abs(debit ?? 0);
    case 'credit-positive':
      if (credit !== null && debit === null) {
        return Math.abs(credit);
      }
      if (debit !== null && credit === null) {
        return -Math.abs(debit);
      }
      return Math.abs(credit ?? 0) - Math.abs(debit ?? 0);
    case 'invert':
      if (debit !== null && credit === null) {
        return -debit;
      }
      if (credit !== null && debit === null) {
        return -credit;
      }
      return (credit ?? 0) - (debit ?? 0);
    case 'as-is':
    default:
      if (debit !== null && credit === null) {
        return debit;
      }
      if (credit !== null && debit === null) {
        return credit;
      }
      return (credit ?? 0) - (debit ?? 0);
  }
}

function getRowValue(
  row: unknown[],
  header: DetectedImportHeader,
  profile: MerchantImportProfile,
): number | null {
  if (header.mode === 'single-value') {
    const raw = row[header.valueColumnIndex!];
    const parsed = toNullableNumber(raw);
    return parsed === null ? null : applySignRule(parsed, profile.signRule);
  }

  return computeDebitCreditValue(
    row[header.debitColumnIndex!],
    row[header.creditColumnIndex!],
    profile.signRule,
  );
}

function rowHasAnyData(row: unknown[]): boolean {
  return row.some(
    (cell) =>
      cell !== null && cell !== undefined && String(cell).trim().length > 0,
  );
}

function shouldSkipRow(
  row: unknown[],
  description: string,
  profile: MerchantImportProfile,
): boolean {
  if (!rowHasAnyData(row)) {
    return true;
  }

  const normalizedDescription = description.trim().toLowerCase();
  const patterns = [
    ...GLOBAL_SKIP_ROW_PATTERNS,
    ...(profile.skipRowPatterns?.map((pattern) => new RegExp(pattern, 'i')) ??
      []),
  ];

  if (
    normalizedDescription &&
    patterns.some((pattern) => pattern.test(normalizedDescription))
  ) {
    return true;
  }

  const firstNonEmpty = row
    .map((cell) => toNullableString(cell))
    .find((cell) => cell !== null);

  if (
    firstNonEmpty &&
    patterns.some((pattern) => pattern.test(firstNonEmpty.toLowerCase()))
  ) {
    return true;
  }

  return false;
}

export function mapRawRowsToImportRows(
  rows: unknown[][],
  header: DetectedImportHeader,
  profile: MerchantImportProfile,
): ImportedSpreadsheetRow[] {
  const dataRows = rows.slice(header.headerRowIndex + 1);
  const mappedRows: ImportedSpreadsheetRow[] = [];

  for (const row of dataRows) {
    const description = toNullableString(row[header.descriptionColumnIndex]) ?? '';

    if (shouldSkipRow(row, description, profile)) {
      continue;
    }

    const mappedRow: ImportedSpreadsheetRow = {
      date: parseImportDate(
        row[header.dateColumnIndex],
        profile.dateFormat,
      ),
      description,
      value: getRowValue(row, header, profile),
      categoryId: null,
    };

    if (header.balanceColumnIndex !== undefined) {
      mappedRow.balance = toNullableNumber(row[header.balanceColumnIndex]);
    }

    if (
      mappedRow.date !== null ||
      mappedRow.description.length > 0 ||
      mappedRow.value !== null ||
      (mappedRow.balance ?? null) !== null
    ) {
      mappedRows.push(mappedRow);
    }
  }

  return mappedRows;
}
