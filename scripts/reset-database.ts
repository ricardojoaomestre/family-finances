import { config } from 'dotenv';
import path from 'node:path';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

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
      'DATABASE_URL is not set. Use .env.local locally or set DATABASE_URL (and optionally DATABASE_URL_UNPOOLED for migrations) in your environment.',
    );
  }

  return databaseUrl;
}

function requireConfirmation() {
  const confirmed =
    process.argv.includes('--confirm') || process.env.DB_RESET_CONFIRM === '1';

  if (!confirmed) {
    console.error(
      'Refusing to reset the database without confirmation.\n' +
        'This drops all tables and data, then re-runs migrations.\n' +
        'Re-run with --confirm or DB_RESET_CONFIRM=1.',
    );
    process.exit(1);
  }
}

async function resetDatabase() {
  loadEnv();
  requireConfirmation();

  const sql = neon(getDatabaseUrl());

  console.log('Dropping schemas...');
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO public`;

  console.log('Running migrations...');
  const db = drizzle(sql);
  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), 'drizzle'),
  });

  console.log('Database reset complete.');
}

resetDatabase().catch((error) => {
  console.error('Database reset failed:', error);
  process.exit(1);
});
