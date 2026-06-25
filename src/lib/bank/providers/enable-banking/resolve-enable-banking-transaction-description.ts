import type { EnableBankingTransaction } from '@/lib/bank/providers/enable-banking/types';

export const MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION =
  '(no description)';

function firstNonEmptyText(
  ...candidates: Array<string | undefined | null>
): string | null {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function joinRemittanceInformation(
  value: EnableBankingTransaction['remittance_information'],
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim() || null;
  }

  const joined = value
    .map((line) => line?.trim())
    .filter(Boolean)
    .join(' ');

  return joined || null;
}

function formatBankTransactionCode(
  code: EnableBankingTransaction['bank_transaction_code'],
): string | null {
  const description = code?.description?.trim();
  if (description) {
    return description;
  }

  const parts = [code?.code?.trim(), code?.sub_code?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join('/') : null;
}

export function resolveEnableBankingTransactionDescription(
  transaction: EnableBankingTransaction,
): string {
  return (
    firstNonEmptyText(
      joinRemittanceInformation(transaction.remittance_information),
      transaction.note,
      transaction.creditor?.name,
      transaction.debtor?.name,
      transaction.creditor_agent?.name,
      transaction.debtor_agent?.name,
      transaction.reference_number,
      formatBankTransactionCode(transaction.bank_transaction_code),
      transaction.merchant_category_code
        ? `MCC ${transaction.merchant_category_code}`
        : null,
    ) ?? MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION
  );
}

export function enableBankingTransactionNeedsDetails(
  transaction: EnableBankingTransaction,
): boolean {
  return (
    resolveEnableBankingTransactionDescription(transaction) ===
      MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION &&
    Boolean(transaction.transaction_id?.trim())
  );
}

export function mergeEnableBankingTransactionDetails(
  summary: EnableBankingTransaction,
  details: EnableBankingTransaction,
): EnableBankingTransaction {
  return {
    ...summary,
    ...details,
    entry_reference: summary.entry_reference ?? details.entry_reference,
    transaction_id: summary.transaction_id ?? details.transaction_id,
  };
}
