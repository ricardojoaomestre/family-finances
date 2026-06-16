import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';

export type RowNoteMatch = {
  noteId: string;
  context: string | null;
  confirmed: boolean;
};

export type NoteForImportMatch = {
  id: string;
  merchant: string;
  date: Date;
  value: string;
  categoryId: string;
  context: string | null;
};

export type NoteRow = {
  id: string;
  merchant: string;
  date: Date;
  value: string;
  categoryId: string;
  categoryName: string;
  categoryColor: CategoryColorToken;
  categoryIcon: CategoryIconName;
  categoryActive: boolean;
  categoryType: 'spending' | 'income';
  context: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NoteCategoryOption = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
  type: 'spending' | 'income';
};

export type NoteFormInput = {
  id?: string;
  merchant: string;
  date: string;
  amount: string;
  categoryId: string;
  context: string;
};

export type NoteFormField =
  | 'merchant'
  | 'date'
  | 'amount'
  | 'categoryId'
  | 'context';
