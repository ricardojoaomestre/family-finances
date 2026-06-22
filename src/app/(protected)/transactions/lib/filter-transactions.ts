import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';

export type FilterableTransactionRow = {
  date: Date;
  description: string;
  categoryId: string | null;
  bankAccountId: string;
};

export const ALL_FILTER_VALUE = 'all';
export const UNCATEGORIZED_FILTER_VALUE = 'uncategorized';

export type TransactionFilters = {
  description: string;
  categoryId: string;
  bankAccountId: string;
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  description: '',
  categoryId: ALL_FILTER_VALUE,
  bankAccountId: ALL_FILTER_VALUE,
  dateFrom: '',
  dateTo: '',
};

export function hasActiveTransactionFilters(filters: TransactionFilters): boolean {
  return (
    filters.description.trim() !== '' ||
    filters.categoryId !== ALL_FILTER_VALUE ||
    filters.bankAccountId !== ALL_FILTER_VALUE ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''
  );
}

export function filterTransactions<T extends FilterableTransactionRow>(
  rows: T[],
  filters: TransactionFilters,
): T[] {
  const descriptionQuery = filters.description.trim().toLowerCase();

  return rows.filter((row) => {
    if (
      descriptionQuery &&
      !row.description.toLowerCase().includes(descriptionQuery)
    ) {
      return false;
    }

    if (filters.categoryId !== ALL_FILTER_VALUE) {
      if (filters.categoryId === UNCATEGORIZED_FILTER_VALUE) {
        if (row.categoryId) {
          return false;
        }
      } else if (row.categoryId !== filters.categoryId) {
        return false;
      }
    }

    if (
      filters.bankAccountId !== ALL_FILTER_VALUE &&
      row.bankAccountId !== filters.bankAccountId
    ) {
      return false;
    }

    if (filters.dateFrom || filters.dateTo) {
      const dayKey = getCalendarDayKey(row.date);

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
