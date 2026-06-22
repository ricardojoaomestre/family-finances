import { config } from 'dotenv';
import path from 'node:path';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

import { repairPartialMigration0016 } from './repair-partial-migration-0016';

function loadEnv() {
  if (!process.env.DATABASE_URL) {
    config({ path: '.env.local' });
    config({ path: '.env' });
  }
}

function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Use .env.local locally or set DATABASE_URL in your environment.',
    );
  }

  return databaseUrl;
}

async function runMigrations() {
  loadEnv();
  const databaseUrl = getDatabaseUrl();
  const sql = neon(databaseUrl);

  await repairPartialMigration0016(sql);

  const db = drizzle(sql);

  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), 'drizzle'),
  });

  console.log('Migrations applied.');
}

runMigrations().catch((error) => {
  console.error('[run-migrations]', error);
  process.exit(1);
});
