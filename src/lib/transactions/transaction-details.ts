import type { ImportStatus } from '@/db/schema';
import type { CategoryColorToken } from '@/lib/categories/category-colors';

export type TransactionDetails = {
  id: string;
  date: string;
  description: string;
  value: string;
  merchant: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: CategoryColorToken | null;
  importId: string;
  importFilename: string;
  importStatus: ImportStatus;
  importImportedAt: string;
  insertedAt: string | null;
  updatedAt: string | null;
};
