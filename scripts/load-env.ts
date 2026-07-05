import { config } from 'dotenv';

if (!process.env.DATABASE_URL) {
  config({ path: '.env.local' });
  config({ path: '.env' });
}
