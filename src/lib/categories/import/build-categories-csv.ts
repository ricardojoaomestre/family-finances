import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import type { CategoryType } from '@/lib/categories/category-type';

import { serializeSemicolonCsv } from './serialize-semicolon-csv';

const CATEGORY_CSV_HEADER = [
  'name',
  'regex',
  'type',
  'active',
  'color',
  'icon',
] as const;

export type CategoryCsvExportRow = {
  name: string;
  pattern: string | null;
  type: CategoryType;
  active: boolean;
  color: CategoryColorToken;
  icon: CategoryIconName;
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
      row.icon,
    ]),
  ];

  return serializeSemicolonCsv(table);
}
