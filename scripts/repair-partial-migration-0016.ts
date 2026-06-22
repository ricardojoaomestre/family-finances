import type { NeonQueryFunction } from '@neondatabase/serverless';

/** Matches `when` in drizzle/meta/_journal.json for 0016_household_multi_tenant. */
export const MIGRATION_0016_TIMESTAMP = 1780250000000;

/**
 * Migration 0016 originally created `household` before backfilling `householdId`
 * on tables that already had rows. On production that fails partway through;
 * Drizzle only records the migration after all statements succeed, so the next
 * deploy retries `CREATE TABLE household` and hits "relation already exists".
 */
export async function repairPartialMigration0016(
  sql: NeonQueryFunction<false, false>,
): Promise<void> {
  const [{ drizzleSchemaExists }] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.schemata
      WHERE schema_name = 'drizzle'
    ) AS "drizzleSchemaExists"
  `;

  let lastMigrationTs = 0;

  if (drizzleSchemaExists) {
    const [{ lastMigrationTs: recordedTs }] = await sql`
      SELECT COALESCE(MAX(created_at), 0)::bigint AS "lastMigrationTs"
      FROM drizzle.__drizzle_migrations
    `;
    lastMigrationTs = Number(recordedTs);
  }

  if (lastMigrationTs >= MIGRATION_0016_TIMESTAMP) {
    return;
  }

  const [{ householdExists }] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'household'
    ) AS "householdExists"
  `;

  if (!householdExists) {
    return;
  }

  const [{ categoryHouseholdIdExists }] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'category'
        AND column_name = 'householdId'
    ) AS "categoryHouseholdIdExists"
  `;

  if (categoryHouseholdIdExists) {
    console.warn(
      '[repair-partial-migration-0016] household exists and category.householdId is present, but migration 0016 is not recorded. Skipping automatic rollback — stamp migrations manually or run db:reset on a non-production database.',
    );
    return;
  }

  console.log(
    '[repair-partial-migration-0016] Rolling back partial household migration artifacts…',
  );

  await sql`ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_activeHouseholdId_household_id_fk"`;
  await sql`ALTER TABLE "user" DROP COLUMN IF EXISTS "activeHouseholdId"`;
  await sql`DROP TABLE IF EXISTS "household_invite" CASCADE`;
  await sql`DROP TABLE IF EXISTS "household_member" CASCADE`;
  await sql`DROP TABLE IF EXISTS "household" CASCADE`;

  console.log('[repair-partial-migration-0016] Rollback complete.');
}
