import type { MerchantSlug } from '@/lib/merchants';

import { buildDuplicateKey } from './duplicate-key';
import type { ImportedSpreadsheetRow } from './types';
import {
  validateImportRow,
  type RowValidation,
} from './validate-import-row';

export type DuplicateReason = 'inFile' | 'existing';

export type RowDuplicateStatus =
  | { isDuplicate: true; reason: DuplicateReason }
  | { isDuplicate: false };

export type ClassifiedImportRow = {
  row: ImportedSpreadsheetRow;
  validation: RowValidation;
  duplicate: RowDuplicateStatus;
};

export function detectDuplicateStatuses(
  rows: ImportedSpreadsheetRow[],
  existingKeys: Set<string>,
  merchant: MerchantSlug,
): RowDuplicateStatus[] {
  const seenInFile = new Set<string>();

  return rows.map((row) => {
    const validation = validateImportRow(row);

    if (!validation.valid) {
      return { isDuplicate: false as const };
    }

    const key = buildDuplicateKey(row.date!, row.value!, merchant);

    if (existingKeys.has(key)) {
      return { isDuplicate: true as const, reason: 'existing' as const };
    }

    if (seenInFile.has(key)) {
      return { isDuplicate: true as const, reason: 'inFile' as const };
    }

    seenInFile.add(key);
    return { isDuplicate: false as const };
  });
}

export function classifyImportRows(
  rows: ImportedSpreadsheetRow[],
  existingKeys: Set<string>,
  merchant: MerchantSlug,
): ClassifiedImportRow[] {
  const duplicateStatuses = detectDuplicateStatuses(
    rows,
    existingKeys,
    merchant,
  );

  return rows.map((row, index) => ({
    row,
    validation: validateImportRow(row),
    duplicate: duplicateStatuses[index]!,
  }));
}

export function isImportableRow(classified: ClassifiedImportRow): boolean {
  return classified.validation.valid && !classified.duplicate.isDuplicate;
}

export type SkippedRowReason =
  | 'invalid'
  | 'duplicate_in_file'
  | 'duplicate_existing';

export function getSkippedRowReason(
  classified: ClassifiedImportRow,
): SkippedRowReason {
  if (!classified.validation.valid) {
    return 'invalid';
  }

  if (
    classified.duplicate.isDuplicate &&
    classified.duplicate.reason === 'inFile'
  ) {
    return 'duplicate_in_file';
  }

  return 'duplicate_existing';
}

export function getDuplicateTooltipMessage(reason: DuplicateReason): string {
  return reason === 'existing'
    ? 'Already imported'
    : 'Repeated in this file';
}
