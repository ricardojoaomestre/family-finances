export type TransactionRow = {
  id: string;
  date: Date;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  value: string;
  importId: string;
  bankAccountId: string;
  bankAccountLabel: string;
};
