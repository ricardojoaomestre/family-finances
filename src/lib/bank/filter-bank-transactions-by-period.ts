import type { BankTransaction } from '@/lib/bank/types';

export function getBankTransactionDateKey(
  transaction: BankTransaction,
): string | null {
  const raw = (transaction.bookingDate || transaction.valueDate)?.trim();
  if (!raw) {
    return null;
  }

  const dateKey = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : null;
}

export function filterBankTransactionsByPeriod(
  transactions: BankTransaction[],
  dateFrom: string,
  dateTo: string,
): BankTransaction[] {
  return transactions.filter((transaction) => {
    const dateKey = getBankTransactionDateKey(transaction);
    if (!dateKey) {
      return false;
    }

    return dateKey >= dateFrom && dateKey <= dateTo;
  });
}
