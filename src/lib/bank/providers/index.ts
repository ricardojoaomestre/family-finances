import { registerBankAggregatorProvider } from '@/lib/bank/registry';
import { createEnableBankingBankAggregatorProvider } from '@/lib/bank/providers/enable-banking/provider';

registerBankAggregatorProvider(
  'enable-banking',
  createEnableBankingBankAggregatorProvider,
);
