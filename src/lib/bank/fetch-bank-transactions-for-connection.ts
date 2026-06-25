import type { BankAggregatorProvider } from '@/lib/bank/provider';
import { filterBankTransactionsByPeriod } from '@/lib/bank/filter-bank-transactions-by-period';
import type {
  FetchBankTransactionsInput,
  FetchBankTransactionsResult,
} from '@/lib/bank/types';

export async function fetchBankTransactionsForConnection(
  provider: BankAggregatorProvider,
  input: FetchBankTransactionsInput,
): Promise<FetchBankTransactionsResult> {
  const connection = await provider.getConnection(input.connectionId);
  const accountIds =
    input.accountIds && input.accountIds.length > 0
      ? input.accountIds
      : connection.accountIds;

  const accounts = await Promise.all(
    accountIds.map(async (accountId) => {
      const account = await provider.getAccount(accountId);
      const descriptionSourceAccountIds =
        account.cashAccountType === 'CARD'
          ? connection.accountIds.filter((id) => id !== accountId)
          : undefined;
      const transactions = await provider.getTransactions({
        accountId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        fetchMode: input.fetchMode,
        descriptionSourceAccountIds,
        cashAccountType: account.cashAccountType,
        currency: account.currency,
        product: account.product,
        psuHeaders: input.psuHeaders,
      });

      return {
        account,
        transactions:
          input.fetchMode === 'initial'
            ? transactions
            : filterBankTransactionsByPeriod(
                transactions,
                input.dateFrom,
                input.dateTo,
              ),
      };
    }),
  );

  return { accounts };
}
