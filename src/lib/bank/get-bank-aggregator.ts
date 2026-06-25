import { getBankAggregatorProviderId } from '@/lib/bank/config';
import { createBankAggregatorProvider } from '@/lib/bank/registry';
import type { BankAggregatorProvider } from '@/lib/bank/provider';

import '@/lib/bank/providers';

export function getBankAggregatorProvider(
  providerId = getBankAggregatorProviderId(),
): BankAggregatorProvider {
  if (!providerId) {
    throw new Error(
      'BANK_AGGREGATOR_PROVIDER is not set. Add it to .env.local when a provider is configured.',
    );
  }

  return createBankAggregatorProvider(providerId);
}
