export function getBankAggregatorRedirectUrl(): string {
  const explicitRedirect = process.env.BANK_AGGREGATOR_REDIRECT_URL?.trim();
  if (explicitRedirect) {
    return explicitRedirect.replace(/\/$/, '');
  }

  const appUrl =
    process.env.AUTH_URL?.trim() || 'https://localhost:3000';
  return `${appUrl.replace(/\/$/, '')}/api/bank/callback`;
}

export function getBankAggregatorProviderId(): string | null {
  const providerId = process.env.BANK_AGGREGATOR_PROVIDER?.trim();
  return providerId || null;
}

export function isBankAggregatorConfigured(): boolean {
  return getBankAggregatorProviderId() !== null;
}
