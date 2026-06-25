import type { BankTransaction } from '@/lib/bank/types';
import type { ImportedSpreadsheetRow } from '@/lib/file-import/types';

export function mapBankTransactionToImportRow(
  transaction: BankTransaction,
): ImportedSpreadsheetRow {
  return {
    date: transaction.bookingDate || transaction.valueDate || null,
    description: transaction.description.trim(),
    value: transaction.amount,
    balance: transaction.balance ?? null,
    categoryId: null,
  };
}

export function mapBankTransactionsToImportRows(
  transactions: BankTransaction[],
): ImportedSpreadsheetRow[] {
  return transactions.map(mapBankTransactionToImportRow);
}
