import { encodeBankInstitutionId } from '@/lib/bank/institution-id';
import type {
  BankAccount,
  BankConnection,
  BankConnectionStatus,
  BankInstitution,
  BankTransaction,
} from '@/lib/bank/types';
import type {
  EnableBankingAccountResource,
  EnableBankingAspsp,
  EnableBankingBalance,
  EnableBankingGetSessionResponse,
  EnableBankingTransaction,
} from '@/lib/bank/providers/enable-banking/types';
import { resolveEnableBankingTransactionDescription } from '@/lib/bank/providers/enable-banking/resolve-enable-banking-transaction-description';

export function mapEnableBankingAspspToInstitution(
  aspsp: EnableBankingAspsp,
): BankInstitution {
  const maxHistoricalDays = aspsp.maximum_consent_validity
    ? Math.max(1, Math.floor(aspsp.maximum_consent_validity / 86_400))
    : 90;

  return {
    id: encodeBankInstitutionId(aspsp.country, aspsp.name),
    name: aspsp.name,
    countryCode: aspsp.country.toUpperCase(),
    maxHistoricalDays,
  };
}

export function mapEnableBankingSessionToConnection(
  sessionId: string,
  session: EnableBankingGetSessionResponse,
  fallbackInstitutionId?: string,
): BankConnection {
  const institutionId =
    fallbackInstitutionId ??
    (session.aspsp
      ? encodeBankInstitutionId(session.aspsp.country, session.aspsp.name)
      : 'unknown');

  return {
    id: sessionId,
    institutionId,
    status: resolveEnableBankingConnectionStatus(session),
    accountIds: session.accounts ?? [],
  };
}

export function mapEnableBankingAccountResource(
  account: EnableBankingAccountResource,
): BankAccount {
  return {
    id: account.uid ?? '',
    iban: account.account_id?.iban,
    name: account.name ?? account.details,
    ownerName: account.account_servicer?.name,
    currency: account.currency,
  };
}

export function mapEnableBankingAccountDetails(
  accountId: string,
  details: Record<string, unknown>,
): BankAccount {
  const accountIdPayload = details.account_id as { iban?: string } | undefined;

  return {
    id: accountId,
    iban: accountIdPayload?.iban,
    name:
      typeof details.name === 'string'
        ? details.name
        : typeof details.details === 'string'
          ? details.details
          : undefined,
    currency: typeof details.currency === 'string' ? details.currency : undefined,
    cashAccountType:
      typeof details.cash_account_type === 'string'
        ? details.cash_account_type
        : undefined,
    product: typeof details.product === 'string' ? details.product : undefined,
  };
}

export function mapEnableBankingTransaction(
  transaction: EnableBankingTransaction,
): BankTransaction {
  const rawAmount = Number.parseFloat(transaction.transaction_amount?.amount ?? '0');
  const signedAmount =
    transaction.credit_debit_indicator === 'DBIT'
      ? -Math.abs(rawAmount)
      : Math.abs(rawAmount);
  const description = resolveEnableBankingTransactionDescription(transaction);

  const balanceAmount = transaction.balance_after_transaction?.amount;
  const balance =
    balanceAmount !== undefined ? Number.parseFloat(balanceAmount) : null;

  return {
    id:
      transaction.entry_reference ??
      transaction.transaction_id ??
      `${transaction.booking_date ?? transaction.value_date ?? 'unknown'}-${description}-${signedAmount}`,
    bookingDate:
      transaction.booking_date ??
      transaction.value_date ??
      transaction.transaction_date ??
      '',
    valueDate: transaction.value_date ?? transaction.transaction_date,
    amount: Number.isFinite(signedAmount) ? signedAmount : 0,
    currency: transaction.transaction_amount?.currency ?? 'EUR',
    description,
    pending: transaction.status !== 'BOOK',
    balance: Number.isFinite(balance ?? NaN) ? balance : null,
  };
}

function resolveEnableBankingConnectionStatus(
  session: EnableBankingGetSessionResponse,
): BankConnectionStatus {
  const validUntil = session.access?.valid_until;
  if (validUntil) {
    const expiresAt = Date.parse(validUntil);
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      return 'expired';
    }
  }

  if ((session.accounts?.length ?? 0) > 0) {
    return 'linked';
  }

  return 'pending';
}

export function buildEnableBankingAccessValidUntil(
  maxHistoricalDays: number,
): string {
  const validUntil = new Date();
  validUntil.setUTCDate(validUntil.getUTCDate() + maxHistoricalDays);
  return validUntil.toISOString();
}

const PREFERRED_BALANCE_TYPES = ['CLBD', 'ITBD', 'CLAV', 'ITAV', 'OPBD'] as const;

export function pickEnableBankingBookedBalance(
  balances: EnableBankingBalance[],
): number | null {
  for (const balanceType of PREFERRED_BALANCE_TYPES) {
    const match = balances.find(
      (balance) => balance.balance_type === balanceType,
    );
    const amount = parseEnableBankingAmount(match?.balance_amount?.amount);
    if (amount !== null) {
      return amount;
    }
  }

  for (const balance of balances) {
    const amount = parseEnableBankingAmount(balance.balance_amount?.amount);
    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

export function isBankTransactionDateRangeAnchoredToToday(
  dateTo: string,
): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateTo >= today;
}

export function enrichTransactionsWithRunningBalances(
  transactions: BankTransaction[],
  accountBalance: number | null,
): BankTransaction[] {
  if (transactions.length === 0) {
    return transactions;
  }

  if (transactions.every((transaction) => transaction.balance != null)) {
    return transactions;
  }

  const enriched = transactions.map((transaction) => ({ ...transaction }));
  const sortedNewestFirst = enriched
    .map((transaction, index) => ({ transaction, index }))
    .sort(compareBankTransactionsNewestFirst);
  const sortedOldestFirst = [...sortedNewestFirst].reverse();

  let runningBalance: number | null = accountBalance;

  for (const { transaction, index } of sortedNewestFirst) {
    if (transaction.balance != null) {
      runningBalance = transaction.balance;
      continue;
    }

    if (runningBalance == null) {
      continue;
    }

    enriched[index] = {
      ...transaction,
      balance: roundMoney(runningBalance),
    };
    runningBalance = roundMoney(runningBalance - transaction.amount);
  }

  runningBalance = null;

  for (const { transaction, index } of sortedOldestFirst) {
    const currentBalance = enriched[index]!.balance;

    if (currentBalance != null) {
      runningBalance = currentBalance;
      continue;
    }

    if (runningBalance == null) {
      continue;
    }

    runningBalance = roundMoney(runningBalance + transaction.amount);
    enriched[index] = {
      ...transaction,
      balance: runningBalance,
    };
  }

  return enriched;
}

export async function enrichBankTransactionsWithAccountBalance(
  transactions: BankTransaction[],
  options: {
    dateTo: string;
    fetchAccountBalance?: () => Promise<number | null>;
  },
): Promise<BankTransaction[]> {
  if (transactions.every((transaction) => transaction.balance != null)) {
    return transactions;
  }

  let accountBalance: number | null = null;

  if (
    options.fetchAccountBalance &&
    isBankTransactionDateRangeAnchoredToToday(options.dateTo)
  ) {
    accountBalance = await options.fetchAccountBalance();
  }

  return enrichTransactionsWithRunningBalances(transactions, accountBalance);
}

function compareBankTransactionsNewestFirst(
  left: { transaction: BankTransaction; index: number },
  right: { transaction: BankTransaction; index: number },
): number {
  const dateCompare = right.transaction.bookingDate.localeCompare(
    left.transaction.bookingDate,
  );
  if (dateCompare !== 0) {
    return dateCompare;
  }

  return right.transaction.id.localeCompare(left.transaction.id);
}

function parseEnableBankingAmount(amount: string | undefined): number | null {
  if (!amount) {
    return null;
  }

  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
