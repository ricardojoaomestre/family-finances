import type { ImportStatus } from '@/db/schema';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';

export type TransactionDetails = {
  id: string;
  date: string;
  description: string;
  value: string;
  balance: string | null;
  bankAccountId: string;
  bankAccountLabel: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: CategoryColorToken | null;
  categoryIcon: CategoryIconName | null;
  importId: string;
  importFilename: string | null;
  importStatus: ImportStatus;
  importImportedAt: string;
  insertedAt: string | null;
  updatedAt: string | null;
};
