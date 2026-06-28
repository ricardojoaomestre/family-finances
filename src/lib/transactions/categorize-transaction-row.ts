export type CategorizeTransactionRow = {
  id: string;
  date: Date;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  value: string;
  balance: string | null;
  bankAccountLabel?: string;
};
