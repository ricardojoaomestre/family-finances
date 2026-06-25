import { config } from 'dotenv';

export function loadBankEnv() {
  config({ path: '.env.local' });
  config({ path: '.env' });
}
