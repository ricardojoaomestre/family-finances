import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';
import type { ImportedSpreadsheetRow } from '@/lib/file-import/types';

type SkippedRowRecord = {
  date: Date | null;
  description: string;
  value: string | null;
};

export function skippedRowToSpreadsheetRow(
  row: SkippedRowRecord,
): ImportedSpreadsheetRow {
  return {
    date: row.date ? getCalendarDayKey(row.date) : null,
    description: row.description,
    value: row.value !== null ? Number(row.value) : null,
    categoryId: null,
  };
}
