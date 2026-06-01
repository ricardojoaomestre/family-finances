import {
  buildDuplicateKey,
  detectDuplicateStatuses,
  getSkippedRowReason,
  validateImportRow,
  type ImportedSpreadsheetRow,
} from '@/lib/file-import';
import type { ImportSkippedRowReason } from '@/db/schema';
import type { MerchantSlug } from '@/lib/merchants';

export type SkippedImportRowClassification = {
  reason: ImportSkippedRowReason;
  errors: string[] | null;
  isValid: boolean;
};

export function classifySkippedImportRow(
  row: ImportedSpreadsheetRow,
  merchant: MerchantSlug,
  existingKeys: Set<string>,
  siblingKeys: Set<string>,
): SkippedImportRowClassification {
  const validation = validateImportRow(row);

  if (!validation.valid) {
    return {
      isValid: false,
      reason: 'invalid',
      errors: validation.errors,
    };
  }

  const [duplicate] = detectDuplicateStatuses([row], existingKeys, merchant);
  const classified = { row, validation, duplicate: duplicate! };

  if (!duplicate!.isDuplicate) {
    if (siblingKeys.has(buildDuplicateKey(row.date!, row.value!, merchant))) {
      return {
        isValid: true,
        reason: 'duplicate_in_file',
        errors: null,
      };
    }

    return {
      isValid: true,
      reason: 'invalid',
      errors: [],
    };
  }

  return {
    isValid: true,
    reason: getSkippedRowReason(classified),
    errors: null,
  };
}

export function serializeSkippedRowErrors(
  errors: string[] | null,
): string | null {
  if (errors === null) {
    return null;
  }

  if (errors.length === 0) {
    return '[]';
  }

  return JSON.stringify(errors);
}

export function isSkippedRowReadyToImport(
  reason: ImportSkippedRowReason,
  errors: string[] | null,
): boolean {
  return reason === 'invalid' && (errors?.length ?? 0) === 0;
}

export function isDuplicateSkippedReason(
  reason: ImportSkippedRowReason,
): boolean {
  return reason === 'duplicate_in_file' || reason === 'duplicate_existing';
}
