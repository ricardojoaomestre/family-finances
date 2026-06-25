import type { EnableBankingClient } from '@/lib/bank/providers/enable-banking/client';
import {
  enableBankingTransactionNeedsDetails,
  mergeEnableBankingTransactionDetails,
  resolveEnableBankingTransactionDescription,
  MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION,
} from '@/lib/bank/providers/enable-banking/resolve-enable-banking-transaction-description';
import type { EnableBankingTransaction } from '@/lib/bank/providers/enable-banking/types';

const DETAILS_FETCH_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]!);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

export async function enrichEnableBankingTransactionsWithDetails(
  client: EnableBankingClient,
  accountId: string,
  transactions: EnableBankingTransaction[],
): Promise<void> {
  const indexesToFetch = transactions.flatMap((transaction, index) =>
    enableBankingTransactionNeedsDetails(transaction) ? [index] : [],
  );

  if (indexesToFetch.length === 0) {
    return;
  }

  await mapWithConcurrency(indexesToFetch, DETAILS_FETCH_CONCURRENCY, async (index) => {
    const summary = transactions[index]!;
    const transactionId = summary.transaction_id?.trim();

    if (!transactionId) {
      return;
    }

    try {
      const details = await client.getAccountTransaction({
        accountId,
        transactionId,
      });
      const merged = mergeEnableBankingTransactionDetails(summary, details);

      if (
        resolveEnableBankingTransactionDescription(merged) !==
        MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION
      ) {
        transactions[index] = merged;
      }
    } catch {
      // Keep the summary row when detail lookup is unavailable.
    }
  });
}
