import { config } from 'dotenv';
import { and, eq, max } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import fs from 'node:fs';
import path from 'node:path';

import {
  bankAccounts,
  budgets,
  categories,
  categoryImportSnapshots,
  householdInvites,
  householdMembers,
  households,
  importSkippedRows,
  imports,
  notes,
  transactions,
  users,
} from '@/db/schema';
import { isCategoryColorToken } from '@/lib/categories/category-colors';
import {
  guessCategoryIcon,
  resolveCategoryIcon,
} from '@/lib/categories/category-icons';
import { resolveCategoryType } from '@/lib/categories/category-type';
import {
  categoryNameKey,
  normalizeCategoryImportPattern,
  parseCategoryCsvRows,
  pickCategoryImportColor,
} from '@/lib/categories/import';
import {
  resolveImportActive,
  resolveImportColor,
  resolveImportIcon,
  resolveImportType,
} from '@/lib/categories/import/resolve-category-import-fields';
import { formatTransactionValueForKey } from '@/lib/file-import/duplicate-key';
import { parseImportDate } from '@/lib/file-import/parse-import-date';
import { parseLocalizedNumber } from '@/lib/file-import/parse-localized-number';
import { seedDefaultBankAccountsForHousehold } from '@/lib/bank-accounts/seed-default-bank-accounts';

import { EXTRATO_CATEGORY_ALIASES } from './seed/extrato-category-aliases';
import { inferSeedCategoryType } from './seed/infer-seed-category-type';
import { mapContaToMerchant } from './seed/map-conta-to-merchant';
import { parseCommaCsv } from './seed/parse-comma-csv';

const FIXTURES_DIR = path.resolve(process.cwd(), 'scripts/fixtures');
const DEFAULT_CATEGORIES_PATH = path.join(FIXTURES_DIR, 'categories.csv');
const DEFAULT_EXTRATO_PATH = path.join(FIXTURES_DIR, 'extrato.csv');
const SEED_IMPORT_FILENAME = 'extrato.csv';

const SEED_BUDGETS_BY_CATEGORY: Record<string, string> = {
  Supermercado: '800.00',
  'Convívio / Restaurantes': '400.00',
  'Transportes / Portagens / Estacionamento': '150.00',
  Combustível: '200.00',
  'Internet + Telemóvel': '120.00',
};

type CategoryRecord = {
  id: string;
  name: string;
};

type ParsedExtratoRow = {
  date: Date;
  description: string;
  value: number;
  categoryLabel: string;
  accountSlug: string;
};

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

function readFixture(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture not found: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

function isUncategorizedLabel(label: string): boolean {
  const trimmed = label.trim();
  return trimmed === '' || trimmed === '?';
}

async function wipeSeedTables(db: ReturnType<typeof drizzle>) {
  await db.delete(transactions);
  await db.delete(importSkippedRows);
  await db.delete(imports);
  await db.delete(notes);
  await db.delete(budgets);
  await db.delete(bankAccounts);
  await db.delete(categoryImportSnapshots);
  await db.delete(categories);
  await db.delete(householdInvites);
  await db.delete(householdMembers);
  await db.delete(households);
}

async function seedHousehold(
  db: ReturnType<typeof drizzle>,
  userId: string,
  userEmail: string | null,
): Promise<string> {
  const owner = userEmail?.split('@')[0] ?? 'My';
  const [household] = await db
    .insert(households)
    .values({
      name: `${owner}'s household`,
    })
    .returning({ id: households.id });

  const householdId = household!.id;

  await seedDefaultBankAccountsForHousehold(householdId);

  await db.insert(householdMembers).values({
    householdId,
    userId,
    role: 'owner',
  });

  await db
    .update(users)
    .set({ activeHouseholdId: householdId })
    .where(eq(users.id, userId));

  return householdId;
}

async function seedCategoriesFromFixture(
  db: ReturnType<typeof drizzle>,
  householdId: string,
  fixturePath: string,
): Promise<number> {
  const parsed = parseCategoryCsvRows(readFixture(fixturePath));

  if ('error' in parsed) {
    throw new Error(`Could not parse categories fixture: ${parsed.error}`);
  }

  const now = new Date();
  let priority = 1;

  for (const row of parsed.rows) {
    const name = row.name.trim();
    const normalizedPattern = normalizeCategoryImportPattern(row.regex);
    const pattern = normalizedPattern === '' ? null : normalizedPattern;
    const type =
      resolveImportType(row.type, parsed.columns.type) ??
      resolveCategoryType(undefined);
    const active = resolveImportActive(row.active, parsed.columns.active) ?? true;
    const color =
      resolveImportColor(row.color, parsed.columns.color) ?? 'blue-200';
    const icon =
      (parsed.columns.icon
        ? resolveImportIcon(row.icon, true)
        : undefined) ?? guessCategoryIcon(name);

    await db.insert(categories).values({
      id: crypto.randomUUID(),
      householdId,
      name,
      description: null,
      color: isCategoryColorToken(color) ? color : 'blue-200',
      icon: resolveCategoryIcon(icon),
      pattern,
      priority,
      active,
      type,
      createdAt: now,
      updatedAt: now,
    });

    priority += 1;
  }

  return parsed.rows.length;
}

async function seedBudgets(
  db: ReturnType<typeof drizzle>,
  householdId: string,
): Promise<number> {
  const categoryRecords = await loadCategoryRecords(db, householdId);
  const categoryByName = new Map(
    categoryRecords.map((record) => [record.name, record.id]),
  );
  const now = new Date();
  let inserted = 0;

  for (const [categoryName, amount] of Object.entries(SEED_BUDGETS_BY_CATEGORY)) {
    const categoryId = categoryByName.get(categoryName);

    if (!categoryId) {
      console.warn(`Skipping budget for unknown category "${categoryName}".`);
      continue;
    }

    await db.insert(budgets).values({
      id: crypto.randomUUID(),
      householdId,
      categoryId,
      amount,
      period: 'monthly',
      createdAt: now,
      updatedAt: now,
    });

    inserted += 1;
  }

  return inserted;
}

async function loadCategoryRecords(
  db: ReturnType<typeof drizzle>,
  householdId: string,
): Promise<CategoryRecord[]> {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.householdId, householdId));
}

async function getNextCategoryPriority(
  db: ReturnType<typeof drizzle>,
  householdId: string,
): Promise<number> {
  const [result] = await db
    .select({ value: max(categories.priority) })
    .from(categories)
    .where(eq(categories.householdId, householdId));

  return (result?.value ?? 0) + 1;
}

async function resolveCategoryId(
  db: ReturnType<typeof drizzle>,
  householdId: string,
  label: string,
  categoryByNameKey: Map<string, CategoryRecord>,
  usedColors: Set<string>,
  nextPriorityRef: { value: number },
  createdCategoryNames: string[],
): Promise<string | null> {
  if (isUncategorizedLabel(label)) {
    return null;
  }

  const trimmedLabel = label.trim();
  const nameKey = categoryNameKey(trimmedLabel);
  const existing = categoryByNameKey.get(nameKey);

  if (existing) {
    return existing.id;
  }

  const aliasTargetName = EXTRATO_CATEGORY_ALIASES[nameKey];

  if (aliasTargetName) {
    const aliased = categoryByNameKey.get(categoryNameKey(aliasTargetName));

    if (aliased) {
      return aliased.id;
    }
  }

  const color = pickCategoryImportColor(usedColors);
  usedColors.add(color);
  const now = new Date();
  const id = crypto.randomUUID();
  const priority = nextPriorityRef.value;
  nextPriorityRef.value += 1;

  await db.insert(categories).values({
    id,
    householdId,
    name: trimmedLabel,
    description: null,
    color: isCategoryColorToken(color) ? color : 'blue-200',
    icon: guessCategoryIcon(trimmedLabel),
    pattern: null,
    priority,
    active: true,
    type: inferSeedCategoryType(trimmedLabel),
    createdAt: now,
    updatedAt: now,
  });

  const record = { id, name: trimmedLabel };
  categoryByNameKey.set(nameKey, record);
  createdCategoryNames.push(trimmedLabel);

  return id;
}

function parseExtratoRows(content: string): {
  rows: ParsedExtratoRow[];
  skippedBlankConta: number;
  skippedInvalid: number;
} {
  const rawRows = parseCommaCsv(content);
  const rows: ParsedExtratoRow[] = [];
  let skippedBlankConta = 0;
  let skippedInvalid = 0;

  for (const rawRow of rawRows) {
    const conta = rawRow.Conta ?? '';

    if (!conta.trim()) {
      skippedBlankConta += 1;
      continue;
    }

    const accountSlug = mapContaToMerchant(conta);

    if (!accountSlug) {
      skippedInvalid += 1;
      console.warn(`Skipping row with unknown Conta "${conta.trim()}".`);
      continue;
    }

    const dateIso = parseImportDate(rawRow.Data, 'DMY');

    if (!dateIso) {
      skippedInvalid += 1;
      console.warn(`Skipping row with invalid date "${rawRow.Data}".`);
      continue;
    }

    const parsedValue = parseLocalizedNumber(rawRow.Valor ?? '');

    if (parsedValue === null) {
      skippedInvalid += 1;
      console.warn(`Skipping row with invalid value "${rawRow.Valor}".`);
      continue;
    }

    const description = (rawRow.Movimento ?? '').trim();

    if (!description) {
      skippedInvalid += 1;
      continue;
    }

    rows.push({
      date: new Date(dateIso),
      description,
      value: -parsedValue,
      categoryLabel: rawRow.Categoria ?? '',
      accountSlug,
    });
  }

  return {
    rows,
    skippedBlankConta,
    skippedInvalid,
  };
}

async function seedTransactions(
  db: ReturnType<typeof drizzle>,
  userId: string,
  householdId: string,
  extratoPath: string,
) {
  const { rows, skippedBlankConta, skippedInvalid } = parseExtratoRows(
    readFixture(extratoPath),
  );

  const categoryRecords = await loadCategoryRecords(db, householdId);
  const categoryByNameKey = new Map(
    categoryRecords.map((record) => [categoryNameKey(record.name), record]),
  );
  const usedColors = new Set(
    (
      await db
        .select({ color: categories.color })
        .from(categories)
        .where(
          and(
            eq(categories.householdId, householdId),
            eq(categories.active, true),
          ),
        )
    ).map((row) => row.color),
  );
  const nextPriorityRef = { value: await getNextCategoryPriority(db, householdId) };
  const createdCategoryNames: string[] = [];

  const rowsByAccountSlug = new Map<string, ParsedExtratoRow[]>();

  for (const row of rows) {
    const bucket = rowsByAccountSlug.get(row.accountSlug) ?? [];
    bucket.push(row);
    rowsByAccountSlug.set(row.accountSlug, bucket);
  }

  let totalTransactions = 0;
  const perAccountCounts: Record<string, number> = {};
  const accountRows = await db
    .select({ id: bankAccounts.id, slug: bankAccounts.slug, label: bankAccounts.label })
    .from(bankAccounts)
    .where(eq(bankAccounts.householdId, householdId));
  const accountIdBySlug = new Map(accountRows.map((row) => [row.slug, row.id]));
  const accountLabelBySlug = new Map(accountRows.map((row) => [row.slug, row.label]));

  for (const [accountSlug, accountRows_] of rowsByAccountSlug) {
    const bankAccountId = accountIdBySlug.get(accountSlug);

    if (!bankAccountId) {
      console.warn(`Skipping rows for unknown account slug "${accountSlug}".`);
      continue;
    }

    const importId = crypto.randomUUID();

    await db.insert(imports).values({
      id: importId,
      householdId,
      filename: SEED_IMPORT_FILENAME,
      rowCount: accountRows_.length,
      skippedCount: 0,
      userId,
      status: 'completed',
      bankAccountId,
    });

    const transactionValues = [];

    for (const row of accountRows_) {
      const categoryId = await resolveCategoryId(
        db,
        householdId,
        row.categoryLabel,
        categoryByNameKey,
        usedColors,
        nextPriorityRef,
        createdCategoryNames,
      );

      transactionValues.push({
        householdId,
        date: row.date,
        description: row.description,
        categoryId,
        value: formatTransactionValueForKey(row.value),
        balance: null,
        importId,
        bankAccountId,
      });
    }

    if (transactionValues.length > 0) {
      await db.insert(transactions).values(transactionValues);
    }

    totalTransactions += transactionValues.length;
    perAccountCounts[accountSlug] = transactionValues.length;
  }

  return {
    totalTransactions,
    perAccountCounts,
    accountLabelBySlug,
    skippedBlankConta,
    skippedInvalid,
    createdCategoryNames,
    merchantImportCount: rowsByAccountSlug.size,
  };
}

async function seedDatabase() {
  loadEnv();

  const categoriesPath = process.env.SEED_CATEGORIES_PATH ?? DEFAULT_CATEGORIES_PATH;
  const extratoPath = process.env.SEED_EXTRATO_PATH ?? DEFAULT_EXTRATO_PATH;
  const db = drizzle(neon(getDatabaseUrl()));

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .limit(1);

  if (!user) {
    throw new Error(
      'No user found. Sign in once via Google before running db:seed.',
    );
  }

  console.log('Wiping seed tables...');
  await wipeSeedTables(db);

  console.log('Creating household...');
  const householdId = await seedHousehold(db, user.id, user.email);

  console.log(`Loading categories from ${categoriesPath}...`);
  const categoryCount = await seedCategoriesFromFixture(
    db,
    householdId,
    categoriesPath,
  );
  console.log(`Inserted ${categoryCount} categories.`);

  console.log('Creating demo budgets...');
  const budgetCount = await seedBudgets(db, householdId);
  console.log(`Inserted ${budgetCount} budgets.`);

  console.log(`Loading transactions from ${extratoPath}...`);
  const result = await seedTransactions(db, user.id, householdId, extratoPath);

  console.log('');
  console.log('Seed complete.');
  console.log(`User: ${user.email ?? user.id}`);
  console.log(`Categories from fixture: ${categoryCount}`);
  console.log(
    `New categories from extrato: ${result.createdCategoryNames.length}`,
  );

  if (result.createdCategoryNames.length > 0) {
    for (const name of result.createdCategoryNames) {
      console.log(`  + ${name}`);
    }
  }

  console.log(`Imports created: ${result.merchantImportCount}`);
  console.log(`Transactions inserted: ${result.totalTransactions}`);
  console.log('Skipped rows:');
  console.log(`  blank Conta: ${result.skippedBlankConta}`);
  console.log(`  invalid/unmapped: ${result.skippedInvalid}`);
  console.log('Transactions per account:');

  for (const [accountSlug, count] of Object.entries(result.perAccountCounts).sort(
    (a, b) =>
      (result.accountLabelBySlug.get(a[0]) ?? a[0]).localeCompare(
        result.accountLabelBySlug.get(b[0]) ?? b[0],
        'pt',
      ),
  )) {
    const label = result.accountLabelBySlug.get(accountSlug) ?? accountSlug;
    console.log(`  ${label} (${accountSlug}): ${count}`);
  }
}

seedDatabase().catch((error) => {
  console.error('[seed-database]', error);
  process.exit(1);
});
