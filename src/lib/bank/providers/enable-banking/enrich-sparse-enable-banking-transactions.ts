import type { EnableBankingTransaction } from '@/lib/bank/providers/enable-banking/types';
import {
  MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION,
  resolveEnableBankingTransactionDescription,
} from '@/lib/bank/providers/enable-banking/resolve-enable-banking-transaction-description';

export function getEnableBankingTransactionDateKey(
  transaction: EnableBankingTransaction,
): string | null {
  const raw =
    transaction.booking_date ??
    transaction.value_date ??
    transaction.transaction_date;
  if (!raw) {
    return null;
  }

  const dateKey = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : null;
}

export function getEnableBankingTransactionAmountKey(
  transaction: EnableBankingTransaction,
): string | null {
  const amount = Number.parseFloat(transaction.transaction_amount?.amount ?? '');
  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.abs(amount).toFixed(2);
}

export function buildEnableBankingTransactionDescriptionIndex(
  transactions: EnableBankingTransaction[],
): Map<string, string> {
  const index = new Map<string, string>();

  for (const transaction of transactions) {
    const description = resolveEnableBankingTransactionDescription(transaction);
    if (description === MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION) {
      continue;
    }

    const dateKey = getEnableBankingTransactionDateKey(transaction);
    const amountKey = getEnableBankingTransactionAmountKey(transaction);
    if (!dateKey || !amountKey) {
      continue;
    }

    index.set(`${dateKey}|${amountKey}`, description);
  }

  return index;
}

function buildFallbackCardTransactionDescription(
  transaction: EnableBankingTransaction,
  context: { currency?: string; product?: string },
): string {
  const dateKey = getEnableBankingTransactionDateKey(transaction);
  const amountKey = getEnableBankingTransactionAmountKey(transaction);
  const currency = transaction.transaction_amount?.currency;
  const currencyLabel =
    currency && currency !== 'XXX' ? currency : context.currency ?? 'EUR';
  const kind =
    transaction.credit_debit_indicator === 'CRDT'
      ? 'Card credit'
      : 'Card purchase';
  const amountLabel = amountKey ? `${amountKey} ${currencyLabel}` : currencyLabel;
  const productLabel = context.product?.trim();

  return [productLabel, kind, amountLabel, dateKey].filter(Boolean).join(' · ');
}

export function enrichSparseEnableBankingTransactions(
  transactions: EnableBankingTransaction[],
  options: {
    descriptionIndex?: Map<string, string>;
    cashAccountType?: string;
    currency?: string;
    product?: string;
  },
): void {
  for (let index = 0; index < transactions.length; index++) {
    const transaction = transactions[index]!;

    if (
      resolveEnableBankingTransactionDescription(transaction) !==
      MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION
    ) {
      continue;
    }

    const dateKey = getEnableBankingTransactionDateKey(transaction);
    const amountKey = getEnableBankingTransactionAmountKey(transaction);
    const lookupKey =
      dateKey && amountKey ? `${dateKey}|${amountKey}` : null;
    const matchedDescription = lookupKey
      ? options.descriptionIndex?.get(lookupKey)
      : undefined;

    if (matchedDescription) {
      transactions[index] = {
        ...transaction,
        remittance_information: [matchedDescription],
      };
      continue;
    }

    if (options.cashAccountType === 'CARD') {
      transactions[index] = {
        ...transaction,
        remittance_information: [
          buildFallbackCardTransactionDescription(transaction, {
            currency: options.currency,
            product: options.product,
          }),
        ],
      };
    }
  }
}
