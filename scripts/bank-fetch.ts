import { loadBankEnv } from '@/lib/bank/load-env';
import { fetchBankTransactionsForConnection } from '@/lib/bank/fetch-bank-transactions-for-connection';
import { getBankAggregatorProvider } from '@/lib/bank/get-bank-aggregator';
import { readBankLocalState } from '@/lib/bank/local-state';
import { mapBankTransactionsToImportRows } from '@/lib/bank/map-bank-transaction-to-import-row';
import {
  INITIAL_SYNC_DAYS,
  getUtcDateKey,
  subtractCalendarDays,
} from '@/lib/bank-connections/sync-quota';

function parseArgs(argv: string[]) {
  const fromIndex = argv.indexOf('--from');
  const toIndex = argv.indexOf('--to');
  const connectionIndex = argv.indexOf('--connection');
  const accountIndex = argv.indexOf('--account');
  const importRowsIndex = argv.indexOf('--as-import-rows');

  const dateFrom = fromIndex >= 0 ? argv[fromIndex + 1]?.trim() : undefined;
  const dateTo = toIndex >= 0 ? argv[toIndex + 1]?.trim() : undefined;
  const connectionId =
    connectionIndex >= 0 ? argv[connectionIndex + 1]?.trim() : undefined;
  const accountId =
    accountIndex >= 0 ? argv[accountIndex + 1]?.trim() : undefined;
  const asImportRows = importRowsIndex >= 0;

  return { dateFrom, dateTo, connectionId, accountId, asImportRows };
}

async function main() {
  loadBankEnv();
  const {
    dateFrom: dateFromArg,
    dateTo: dateToArg,
    connectionId: connectionArg,
    accountId: accountArg,
    asImportRows,
  } = parseArgs(process.argv.slice(2));

  const localState = await readBankLocalState();
  const connectionId = connectionArg ?? localState?.connectionId;

  if (!connectionId) {
    throw new Error(
      'No connection id found. Run npm run bank:connect first, or pass --connection SESSION_ID.',
    );
  }

  const dateTo = dateToArg ?? getUtcDateKey();
  const dateFrom =
    dateFromArg ?? subtractCalendarDays(dateTo, INITIAL_SYNC_DAYS);
  const fetchMode = dateFromArg && dateToArg ? 'recent' : 'initial';

  const provider = getBankAggregatorProvider();
  const connection = await provider.getConnection(connectionId);

  if (connection.accountIds.length === 0) {
    throw new Error(
      `Connection ${connectionId} has no linked accounts (status: ${connection.status}). Whitelist accounts in Enable Banking and reconnect.`,
    );
  }

  const accountIds =
    accountArg && connection.accountIds.includes(accountArg)
      ? [accountArg]
      : accountArg
        ? (() => {
            throw new Error(
              `Account ${accountArg} is not part of connection ${connectionId}.`,
            );
          })()
        : connection.accountIds;

  const result = await fetchBankTransactionsForConnection(provider, {
    connectionId,
    accountIds,
    dateFrom,
    dateTo,
    fetchMode,
  });

  console.log(
    `Fetched transactions for ${result.accounts.length} account(s) using ${fetchMode} mode (${dateFrom} to ${dateTo}).`,
  );

  for (const { account, transactions } of result.accounts) {
    console.log('');
    console.log('Account:', account.name ?? account.id);
    console.log('IBAN:', account.iban ?? '(hidden)');
    console.log('Transactions:', transactions.length);

    const rows = asImportRows
      ? mapBankTransactionsToImportRows(transactions)
      : transactions;

    for (const row of rows) {
      console.log(JSON.stringify(row));
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
