import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { categories } from '@/db/schema';
import { guessCategoryIcon } from '@/lib/categories/category-icon-names';

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

async function ensureIconColumn(databaseUrl: string) {
  const sqlClient = neon(databaseUrl);
  const rows = await sqlClient`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'category'
      AND column_name = 'icon'
    LIMIT 1
  `;

  if (rows.length > 0) {
    return;
  }

  await sqlClient`ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "icon" text DEFAULT 'tag' NOT NULL`;
  console.log('Added missing category.icon column.');
}

async function backfillCategoryIcons() {
  loadEnv();
  const databaseUrl = getDatabaseUrl();
  await ensureIconColumn(databaseUrl);
  const db = drizzle(neon(databaseUrl));

  const rows = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories);

  let updated = 0;

  for (const row of rows) {
    if (row.icon !== 'tag') {
      continue;
    }

    const guessed = guessCategoryIcon(row.name);

    if (guessed === 'tag') {
      continue;
    }

    await db
      .update(categories)
      .set({ icon: guessed, updatedAt: new Date() })
      .where(eq(categories.id, row.id));

    updated += 1;
  }

  console.log(`Backfilled icons for ${updated} categor${updated === 1 ? 'y' : 'ies'}.`);
}

backfillCategoryIcons().catch((error) => {
  console.error('[backfill-category-icons]', error);
  process.exit(1);
});
