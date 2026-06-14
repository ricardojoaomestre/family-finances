import { serializeSemicolonCsv } from '@/lib/categories/import/serialize-semicolon-csv';
import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';
import { getMerchantLabelOrSlug } from '@/lib/merchants';
import type { TransactionRow } from '@/lib/transactions/transaction-row';

const TRANSACTION_CSV_HEADER = [
  'date',
  'description',
  'category',
  'value',
  'merchant',
] as const;

export function buildFilteredTransactionsCsv(rows: TransactionRow[]): string {
  const table: string[][] = [
    [...TRANSACTION_CSV_HEADER],
    ...rows.map((row) => [
      getCalendarDayKey(row.date),
      row.description,
      row.categoryName ?? '',
      row.value,
      getMerchantLabelOrSlug(row.merchant),
    ]),
  ];

  return serializeSemicolonCsv(table);
}
