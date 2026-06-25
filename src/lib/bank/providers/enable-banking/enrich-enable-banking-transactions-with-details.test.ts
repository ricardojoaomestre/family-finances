import { describe, expect, it, vi } from 'vitest';

import { enrichEnableBankingTransactionsWithDetails } from '@/lib/bank/providers/enable-banking/enrich-enable-banking-transactions-with-details';
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
});
