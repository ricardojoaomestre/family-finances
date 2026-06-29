import { describe, expect, it, vi } from 'vitest';

import { enrichEnableBankingTransactionsWithDetails } from '@/lib/bank/providers/enable-banking/enrich-enable-banking-transactions-with-details';
import { enrichSparseEnableBankingTransactions } from '@/lib/bank/providers/enable-banking/enrich-sparse-enable-banking-transactions';
import { resolveEnableBankingTransactionDescription } from '@/lib/bank/providers/enable-banking/resolve-enable-banking-transaction-description';
import type { EnableBankingClient } from '@/lib/bank/providers/enable-banking/client';
import type { EnableBankingTransaction } from '@/lib/bank/providers/enable-banking/types';

describe('enrichEnableBankingTransactionsWithDetails', () => {
  it('fetches transaction details for sparse card rows', async () => {
    const transactions: EnableBankingTransaction[] = [
      {
        entry_reference: 'card-1',
        transaction_id: 'detail-1',
        booking_date: '2026-04-10',
        transaction_amount: { currency: 'EUR', amount: '12.34' },
        credit_debit_indicator: 'DBIT',
        status: 'BOOK',
      },
    ];

    const client = {
      getAccountTransaction: vi.fn().mockResolvedValue({
        entry_reference: 'card-1',
        transaction_id: 'detail-1',
        creditor: { name: 'Pingo Doce' },
      }),
    } as unknown as EnableBankingClient;

    await enrichEnableBankingTransactionsWithDetails(
      client,
      'account-id',
      transactions,
    );

    expect(client.getAccountTransaction).toHaveBeenCalledWith({
      accountId: 'account-id',
      transactionId: 'detail-1',
    });
    expect(transactions[0]?.creditor?.name).toBe('Pingo Doce');
  });

  it('uses detail remittance before card fallback is applied', async () => {
    const transactions: EnableBankingTransaction[] = [
      {
        entry_reference: 'card-1',
        transaction_id: 'detail-1',
        transaction_date: '2026-06-15',
        transaction_amount: { currency: 'EUR', amount: '11.99' },
        credit_debit_indicator: 'DBIT',
        status: 'BOOK',
        remittance_information: [],
      },
    ];

    const client = {
      getAccountTransaction: vi.fn().mockResolvedValue({
        entry_reference: 'card-1',
        transaction_id: 'detail-1',
        remittance_information: ['COMPRA 1131 Spotify P4374FB737 Stockholm'],
      }),
    } as unknown as EnableBankingClient;

    enrichSparseEnableBankingTransactions(transactions, {
      cashAccountType: 'CARD',
      currency: 'EUR',
      product: 'VISA CLASSIC ACTIVOBANK',
      applyCardFallback: false,
    });

    await enrichEnableBankingTransactionsWithDetails(
      client,
      'account-id',
      transactions,
    );

    enrichSparseEnableBankingTransactions(transactions, {
      cashAccountType: 'CARD',
      currency: 'EUR',
      product: 'VISA CLASSIC ACTIVOBANK',
    });

    expect(client.getAccountTransaction).toHaveBeenCalled();
    expect(resolveEnableBankingTransactionDescription(transactions[0]!)).toBe(
      'COMPRA 1131 Spotify P4374FB737 Stockholm',
    );
  });
});
