import type { MerchantImportProfile } from './merchant-profiles';
import { matchesHeaderAlias } from './normalize-header-text';

export type ImportHeaderMode = 'single-value' | 'debit-credit';

export type DetectedImportHeader = {
  headerRowIndex: number;
  dateColumnIndex: number;
  descriptionColumnIndex: number;
  valueColumnIndex?: number;
  debitColumnIndex?: number;
  creditColumnIndex?: number;
  balanceColumnIndex?: number;
  mode: ImportHeaderMode;
};

function findColumnIndex(row: unknown[], aliases: string[]): number | null {
  for (let index = 0; index < row.length; index += 1) {
    if (matchesHeaderAlias(row[index], aliases)) {
      return index;
    }
  }

  return null;
}

function detectRowHeader(
  row: unknown[],
  profile: MerchantImportProfile,
): Omit<DetectedImportHeader, 'headerRowIndex'> | null {
  const dateColumnIndex = findColumnIndex(row, profile.dateColumns);
  const descriptionColumnIndex = findColumnIndex(
    row,
    profile.descriptionColumns,
  );

  if (dateColumnIndex === null || descriptionColumnIndex === null) {
    return null;
  }

  const valueColumnIndex = profile.valueColumns?.length
    ? findColumnIndex(row, profile.valueColumns)
    : null;

  const debitColumnIndex = profile.debitColumns?.length
    ? findColumnIndex(row, profile.debitColumns)
    : null;

  const creditColumnIndex = profile.creditColumns?.length
    ? findColumnIndex(row, profile.creditColumns)
    : null;

  const balanceColumnIndex = profile.balanceColumns?.length
    ? findColumnIndex(row, profile.balanceColumns)
    : null;

  if (valueColumnIndex !== null) {
    return {
      dateColumnIndex,
      descriptionColumnIndex,
      valueColumnIndex,
      balanceColumnIndex: balanceColumnIndex ?? undefined,
      mode: 'single-value',
    };
  }

  if (debitColumnIndex !== null && creditColumnIndex !== null) {
    return {
      dateColumnIndex,
      descriptionColumnIndex,
      debitColumnIndex,
      creditColumnIndex,
      balanceColumnIndex: balanceColumnIndex ?? undefined,
      mode: 'debit-credit',
    };
  }

  return null;
}

export function detectImportHeader(
  rows: unknown[][],
  profile: MerchantImportProfile,
): DetectedImportHeader | null {
  const startRow = profile.minHeaderRow ?? 0;

  for (let rowIndex = startRow; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row) continue;

    const detected = detectRowHeader(row, profile);
    if (detected) {
      return { headerRowIndex: rowIndex, ...detected };
    }
  }

  return null;
}
