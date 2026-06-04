import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryType } from '@/lib/categories/category-type';

import { serializeSemicolonCsv } from './serialize-semicolon-csv';

const CATEGORY_CSV_HEADER = ['name', 'regex', 'type', 'active', 'color'] as const;

export type CategoryCsvExportRow = {
  name: string;
  pattern: string | null;
  type: CategoryType;
  active: boolean;
  color: CategoryColorToken;
};

export function buildCategoriesCsv(rows: CategoryCsvExportRow[]): string {
  const table: string[][] = [
    [...CATEGORY_CSV_HEADER],
    ...rows.map((row) => [
      row.name,
      row.pattern ?? '',
      row.type,
      String(row.active),
      row.color,
    ]),
  ];

  return serializeSemicolonCsv(table);
}
