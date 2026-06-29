import { describe, expect, it } from 'vitest';

import { enrichSparseEnableBankingTransactions } from '@/lib/bank/providers/enable-banking/enrich-sparse-enable-banking-transactions';
import {
  MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION,
  resolveEnableBankingTransactionDescription,
} from '@/lib/bank/providers/enable-banking/resolve-enable-banking-transaction-description';
import type { EnableBankingTransaction } from '@/lib/bank/providers/enable-banking/types';

describe('enrichSparseEnableBankingTransactions', () => {
  it('matches descriptions from sibling account transactions', () => {
    const transactions: EnableBankingTransaction[] = [
      {
        transaction_date: '2026-04-21',
        transaction_amount: { currency: 'XXX', amount: '13.14' },
        credit_debit_indicator: 'CRDT',
        status: 'BOOK',
        remittance_information: [],
      },
    ];

    enrichSparseEnableBankingTransactions(transactions, {
      cashAccountType: 'CARD',
      currency: 'EUR',
      product: 'VISA CLASSIC ACTIVOBANK',
      descriptionIndex: new Map([
        ['2026-04-21|13.14', 'TRF P  RICARDO JOAO TEIXEIRA SANTOS MESTRE'],
      ]),
    });

    expect(resolveEnableBankingTransactionDescription(transactions[0]!)).toBe(
      'TRF P  RICARDO JOAO TEIXEIRA SANTOS MESTRE',
    );
  });

  it('builds a readable fallback when no sibling match exists', () => {
    const transactions: EnableBankingTransaction[] = [
      {
        transaction_date: '2026-04-13',
        transaction_amount: { currency: 'XXX', amount: '11.99' },
        credit_debit_indicator: 'DBIT',
        status: 'BOOK',
        remittance_information: [],
      },
    ];

    enrichSparseEnableBankingTransactions(transactions, {
      cashAccountType: 'CARD',
      currency: 'EUR',
      product: 'VISA CLASSIC ACTIVOBANK',
    });

    expect(resolveEnableBankingTransactionDescription(transactions[0]!)).toBe(
      'VISA CLASSIC ACTIVOBANK · Card purchase · 11.99 EUR · 2026-04-13',
    );
  });

  it('skips card fallback when applyCardFallback is false', () => {
    const transactions: EnableBankingTransaction[] = [
      {
        transaction_date: '2026-04-13',
        transaction_amount: { currency: 'XXX', amount: '11.99' },
        credit_debit_indicator: 'DBIT',
        status: 'BOOK',
        remittance_information: [],
      },
    ];

    enrichSparseEnableBankingTransactions(transactions, {
      cashAccountType: 'CARD',
      currency: 'EUR',
      product: 'VISA CLASSIC ACTIVOBANK',
      applyCardFallback: false,
    });

    expect(resolveEnableBankingTransactionDescription(transactions[0]!)).toBe(
      MISSING_ENABLE_BANKING_TRANSACTION_DESCRIPTION,
    );
  });
});
