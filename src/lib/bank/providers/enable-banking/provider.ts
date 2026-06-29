import { decodeBankInstitutionId } from '@/lib/bank/institution-id';
import type { BankAggregatorProvider } from '@/lib/bank/provider';
import type {
  BankAccount,
  BankConnection,
  BankInstitution,
  BankTransaction,
  BankTransactionQuery,
  CompleteBankConnectionInput,
  CompleteBankConnectionResult,
  StartBankConnectionInput,
  StartBankConnectionResult,
} from '@/lib/bank/types';
import { resolveInitialSyncTransactions } from '@/lib/bank/resolve-initial-sync-transactions';
import { EnableBankingClient, EnableBankingRequestError } from '@/lib/bank/providers/enable-banking/client';
import { enrichEnableBankingTransactionsWithDetails } from '@/lib/bank/providers/enable-banking/enrich-enable-banking-transactions-with-details';
import {
  buildEnableBankingTransactionDescriptionIndex,
  enrichSparseEnableBankingTransactions,
} from '@/lib/bank/providers/enable-banking/enrich-sparse-enable-banking-transactions';
import {
  buildEnableBankingAccessValidUntil,
  enrichTransactionsWithRunningBalances,
  isBankTransactionDateRangeAnchoredToToday,
  mapEnableBankingAccountDetails,
  mapEnableBankingAspspToInstitution,
  mapEnableBankingSessionToConnection,
  mapEnableBankingTransaction,
  pickEnableBankingBookedBalance,
} from '@/lib/bank/providers/enable-banking/mappers';
import type { EnableBankingTransaction } from '@/lib/bank/providers/enable-banking/types';

type RawTransactionQuery = {
  accountId: string;
  dateFrom?: string;
  dateTo?: string;
  psuHeaders?: BankTransactionQuery['psuHeaders'];
  strategy?: 'default' | 'longest';
  includeDateTo?: boolean;
};

async function fetchRawEnableBankingTransactions(
  client: EnableBankingClient,
  query: RawTransactionQuery,
): Promise<EnableBankingTransaction[]> {
  const rawTransactions: EnableBankingTransaction[] = [];
  let continuationKey: string | undefined;

  do {
    const response = await client.getAccountTransactions({
      accountId: query.accountId,
      dateFrom: query.dateFrom,
      dateTo: query.includeDateTo === false ? undefined : query.dateTo,
      continuationKey,
      strategy: query.strategy ?? 'default',
      psuHeaders: query.psuHeaders,
    });

    for (const transaction of response.transactions ?? []) {
      rawTransactions.push(transaction);
    }

    continuationKey = response.continuation_key ?? undefined;
  } while (continuationKey);

  return rawTransactions;
}

async function fetchRawEnableBankingTransactionsWithRetry(
  client: EnableBankingClient,
  query: RawTransactionQuery,
): Promise<EnableBankingTransaction[]> {
  try {
    return await fetchRawEnableBankingTransactions(client, query);
  } catch (error) {
    if (!(error instanceof EnableBankingRequestError)) {
      throw error;
    }

    const correctedDateFrom = error.wrongTransactionsPeriodDateFrom;
    if (!correctedDateFrom || correctedDateFrom === query.dateFrom) {
      throw error;
    }

    return fetchRawEnableBankingTransactions(client, {
      ...query,
      dateFrom: correctedDateFrom,
    });
  }
}

async function fetchTransactionsForMode(
  client: EnableBankingClient,
  query: BankTransactionQuery,
): Promise<EnableBankingTransaction[]> {
  const fetchMode = query.fetchMode ?? 'recent';

  const recentTransactions = await fetchRawEnableBankingTransactionsWithRetry(
    client,
    {
      accountId: query.accountId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      psuHeaders: query.psuHeaders,
      strategy: 'default',
    },
  );

  if (fetchMode === 'recent' || recentTransactions.length > 0) {
    return recentTransactions;
  }

  return fetchRawEnableBankingTransactions(client, {
    accountId: query.accountId,
    psuHeaders: query.psuHeaders,
    strategy: 'default',
  });
}

export function createEnableBankingBankAggregatorProvider(): BankAggregatorProvider {
  const client = new EnableBankingClient();

  return {
    id: 'enable-banking',
    displayName: 'Enable Banking',

    async listInstitutions(countryCode: string): Promise<BankInstitution[]> {
      const response = await client.listAspsps(countryCode);
      return response.aspsps.map(mapEnableBankingAspspToInstitution);
    },

    async startConnection(
      input: StartBankConnectionInput,
    ): Promise<StartBankConnectionResult> {
      const { countryCode, name } = decodeBankInstitutionId(input.institutionId);
      const validUntil = buildEnableBankingAccessValidUntil(
        input.maxHistoricalDays ?? 90,
      );

      const response = await client.startAuthorization({
        aspspName: name,
        aspspCountry: countryCode,
        redirectUrl: input.redirectUrl,
        state: input.reference,
        validUntil,
        language: input.userLanguage,
      });

      return {
        connectionId: response.authorization_id,
        authUrl: response.url,
      };
    },

    async completeConnection(
      input: CompleteBankConnectionInput,
    ): Promise<CompleteBankConnectionResult> {
      const error = input.callbackParams.error?.trim();
      if (error) {
        const description =
          input.callbackParams.error_description?.trim() ?? 'Authorization failed';
        throw new Error(`${error}: ${description}`);
      }

      const code = input.callbackParams.code?.trim();
      if (!code) {
        throw new Error(
          'Missing authorization code in callback. Complete bank login and try again.',
        );
      }

      const session = await client.authorizeSession(code);
      const connection = mapEnableBankingSessionToConnection(
        session.session_id,
        {
          accounts: session.accounts
            .map((account) => account.uid)
            .filter((accountId): accountId is string => Boolean(accountId)),
          aspsp: session.aspsp,
          access: session.access,
        },
      );

      return {
        connection,
        accessValidUntil: session.access?.valid_until ?? null,
      };
    },

    async getConnection(connectionId: string): Promise<BankConnection> {
      const session = await client.getSession(connectionId);
      return mapEnableBankingSessionToConnection(connectionId, session);
    },

    async getAccount(accountId: string): Promise<BankAccount> {
      const details = await client.getAccountDetails(accountId);
      return mapEnableBankingAccountDetails(accountId, details);
    },

    async getTransactions(query: BankTransactionQuery): Promise<BankTransaction[]> {
      const rawTransactions = await fetchTransactionsForMode(client, query);

      if (
        query.descriptionSourceAccountIds?.length ||
        query.cashAccountType === 'CARD'
      ) {
        const descriptionIndex =
          query.descriptionSourceAccountIds?.length
            ? buildEnableBankingTransactionDescriptionIndex(
                (
                  await Promise.all(
                    query.descriptionSourceAccountIds.map((accountId) =>
                      fetchRawEnableBankingTransactions(client, {
                        accountId,
                        dateFrom: query.dateFrom,
                        dateTo: query.dateTo,
                      }),
                    ),
                  )
                ).flat(),
              )
            : undefined;

        enrichSparseEnableBankingTransactions(rawTransactions, {
          descriptionIndex,
          cashAccountType: query.cashAccountType,
          currency: query.currency,
          product: query.product,
          applyCardFallback: false,
        });
      }

      await enrichEnableBankingTransactionsWithDetails(
        client,
        query.accountId,
        rawTransactions,
      );

      if (query.cashAccountType === 'CARD') {
        enrichSparseEnableBankingTransactions(rawTransactions, {
          cashAccountType: query.cashAccountType,
          currency: query.currency,
          product: query.product,
        });
      }

      const transactions = rawTransactions.map(mapEnableBankingTransaction);

      if (query.fetchMode === 'initial') {
        return resolveInitialSyncTransactions(
          transactions,
          query.dateFrom,
          query.dateTo,
        );
      }

      if (transactions.every((transaction) => transaction.balance !== null)) {
        return transactions;
      }

      if (!isBankTransactionDateRangeAnchoredToToday(query.dateTo)) {
        return transactions;
      }

      const balancesResponse = await client.getAccountBalances(
        query.accountId,
        query.psuHeaders,
      );
      const anchorBalance = pickEnableBankingBookedBalance(
        balancesResponse.balances ?? [],
      );

      if (anchorBalance === null) {
        return transactions;
      }

      return enrichTransactionsWithRunningBalances(transactions, anchorBalance);
    },
  };
}
