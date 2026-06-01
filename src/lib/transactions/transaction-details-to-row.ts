import type { TransactionDetails } from '@/lib/transactions/transaction-details';
import type { TransactionRow } from '@/lib/transactions/transaction-row';

export function transactionDetailsToRow(
  details: TransactionDetails,
): TransactionRow {
  return {
    id: details.id,
    date: new Date(details.date),
    description: details.description,
    categoryId: details.categoryId,
    categoryName: details.categoryName,
    categoryColor: details.categoryColor,
    value: details.value,
    importId: details.importId,
    merchant: details.merchant,
  };
}
