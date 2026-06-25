import {
  INITIAL_SYNC_DAYS,
  subtractCalendarDays,
} from '@/lib/bank-connections/sync-quota';
import {
  filterBankTransactionsByPeriod,
  getBankTransactionDateKey,
} from '@/lib/bank/filter-bank-transactions-by-period';
import type { BankTransaction } from '@/lib/bank/types';

export function resolveInitialSyncTransactions(
  transactions: BankTransaction[],
  dateFrom: string,
  dateTo: string,
): BankTransaction[] {
  const inRequestedPeriod = filterBankTransactionsByPeriod(
    transactions,
    dateFrom,
    dateTo,
  );
  if (inRequestedPeriod.length > 0) {
    return inRequestedPeriod;
  }

  const datedTransactions = transactions.filter(
    (transaction) => getBankTransactionDateKey(transaction) !== null,
  );
  if (datedTransactions.length === 0) {
    return [];
  }

  const latestDateKey = datedTransactions.reduce((latest, transaction) => {
    const dateKey = getBankTransactionDateKey(transaction)!;
    return dateKey > latest ? dateKey : latest;
  }, '');

  const fallbackFrom = subtractCalendarDays(
    latestDateKey,
    INITIAL_SYNC_DAYS,
  );

  return filterBankTransactionsByPeriod(
    datedTransactions,
    fallbackFrom,
    latestDateKey,
  );
}
