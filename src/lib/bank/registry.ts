import type { BankAggregatorProviderFactory } from '@/lib/bank/provider';

const providerFactories = new Map<string, BankAggregatorProviderFactory>();

export function registerBankAggregatorProvider(
  id: string,
  factory: BankAggregatorProviderFactory,
): void {
  providerFactories.set(id, factory);
}

export function listRegisteredBankAggregatorProviders(): string[] {
  return [...providerFactories.keys()];
}

export function createBankAggregatorProvider(
  id: string,
): ReturnType<BankAggregatorProviderFactory> {
  const factory = providerFactories.get(id);

  if (!factory) {
    const registered = listRegisteredBankAggregatorProviders();
    const hint =
      registered.length > 0
        ? ` Registered providers: ${registered.join(', ')}.`
        : ' No providers are registered yet.';
    throw new Error(`Unknown bank aggregator provider "${id}".${hint}`);
  }

  return factory();
}
