import { readFileSync } from 'node:fs';

import { loadBankEnv } from '@/lib/bank/load-env';

export function loadEnableBankingEnv() {
  loadBankEnv();
}

export function getEnableBankingAppId(): string {
  const appId = process.env.ENABLE_BANKING_APP_ID?.trim();
  if (!appId) {
    throw new Error(
      'ENABLE_BANKING_APP_ID is not set. Copy the application id from the Enable Banking Control Panel.',
    );
  }
  return appId;
}

export function getEnableBankingPrivateKey(): string {
  const inlineKey = process.env.ENABLE_BANKING_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (inlineKey) {
    return inlineKey;
  }

  const keyPath = process.env.ENABLE_BANKING_PRIVATE_KEY_PATH?.trim();
  if (keyPath) {
    return readFileSync(keyPath, 'utf8');
  }

  throw new Error(
    'Enable Banking private key is not configured. Set ENABLE_BANKING_PRIVATE_KEY or ENABLE_BANKING_PRIVATE_KEY_PATH.',
  );
}

export function getEnableBankingApiBaseUrl(): string {
  return 'https://api.enablebanking.com';
}
