import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';
import type { ImportJobRow } from '@/lib/imports/get-imports';

export type ImportJobFilters = {
  dateFrom: string;
  dateTo: string;
  hideEmptyImports: boolean;
};

export const DEFAULT_IMPORT_JOB_FILTERS: ImportJobFilters = {
  dateFrom: '',
  dateTo: '',
  hideEmptyImports: true,
};

export function hasActiveImportJobFilters(filters: ImportJobFilters): boolean {
  return filters.dateFrom !== '';
}

export function filterImportJobs(
  rows: ImportJobRow[],
  filters: ImportJobFilters,
): ImportJobRow[] {
  return rows.filter((row) => {
    if (filters.hideEmptyImports && row.rowCount === 0) {
      return false;
    }

    if (filters.dateFrom || filters.dateTo) {
      const dayKey = getCalendarDayKey(row.importedAt);

      if (filters.dateFrom && dayKey < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && dayKey > filters.dateTo) {
        return false;
      }
    }

    return true;
  });
}
