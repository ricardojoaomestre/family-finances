import type { MerchantSlug } from '@/lib/merchants';

import { detectImportHeader } from './detect-import-header';
import { getMerchantImportProfile } from './merchant-profiles';
import { mapRawRowsToImportRows } from './map-raw-rows-to-import-rows';
import { parseSpreadsheetToRawGrid } from './parse-spreadsheet-to-raw-grid';
import type { ImportedSpreadsheetRow, SpreadsheetFileType } from './types';

export type ParseBankSpreadsheetResult =
  | {
      ok: true;
      rows: ImportedSpreadsheetRow[];
      usingGenericProfile: boolean;
    }
  | { ok: false; error: string };

export function parseBankSpreadsheet(
  data: ArrayBuffer,
  filename: string,
  fileType: SpreadsheetFileType,
  merchant: MerchantSlug,
): ParseBankSpreadsheetResult {
  const grid = parseSpreadsheetToRawGrid(data, filename, fileType);

  if (grid.rows.length === 0) {
    return {
      ok: false,
      error: 'Could not find any rows in the spreadsheet.',
    };
  }

  const { profile, isConfigured } = getMerchantImportProfile(merchant);
  const header = detectImportHeader(grid.rows, profile);

  if (!header) {
    return {
      ok: false,
      error:
        'Could not find transaction header row. Expected columns for date, description, and amount.',
    };
  }

  const rows = mapRawRowsToImportRows(grid.rows, header, profile);

  if (rows.length === 0) {
    return {
      ok: false,
      error: 'No transaction rows found below the detected header.',
    };
  }

  return {
    ok: true,
    rows,
    usingGenericProfile: !isConfigured,
  };
}
