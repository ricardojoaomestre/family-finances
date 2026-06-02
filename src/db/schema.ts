import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { CategoryType } from '@/lib/categories/category-type';
import type { CategorySnapshotRow } from '@/lib/categories/import/types';

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = pgTable(
  'authenticator',
  {
    credentialID: text('credentialID').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: boolean('credentialBackedUp').notNull(),
    transports: text('transports'),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

export const importStatusEnum = ['completed', 'partial', 'failed'] as const;
export type ImportStatus = (typeof importStatusEnum)[number];

export const categories = pgTable('category', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: text('color').notNull(),
  pattern: text('pattern'),
  priority: integer('priority').notNull(),
  active: boolean('active').notNull().default(true),
  type: text('type').$type<CategoryType>().notNull().default('spending'),
  createdAt: timestamp('createdAt', { mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const CATEGORY_IMPORT_SNAPSHOT_ID = 'latest' as const;

export const categoryImportSnapshots = pgTable('category_import_snapshot', {
  id: text('id').primaryKey(),
  payload: jsonb('payload').$type<CategorySnapshotRow[]>().notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const importSkippedRowReasonEnum = [
  'invalid',
  'duplicate_in_file',
  'duplicate_existing',
] as const;
export type ImportSkippedRowReason =
  (typeof importSkippedRowReasonEnum)[number];

export const imports = pgTable('import', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  filename: text('filename').notNull(),
  importedAt: timestamp('importedAt', { mode: 'date' })
    .notNull()
    .defaultNow(),
  rowCount: integer('rowCount').notNull(),
  skippedCount: integer('skippedCount'),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').$type<ImportStatus>().notNull(),
  merchant: text('merchant').notNull(),
});

export const importSkippedRows = pgTable('import_skipped_row', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  importId: text('importId')
    .notNull()
    .references(() => imports.id, { onDelete: 'cascade' }),
  rowIndex: integer('rowIndex').notNull(),
  date: timestamp('date', { mode: 'date' }),
  description: text('description').notNull(),
  value: numeric('value', { precision: 14, scale: 2 }),
  balance: numeric('balance', { precision: 14, scale: 2 }),
  reason: text('reason').$type<ImportSkippedRowReason>().notNull(),
  errors: text('errors'),
});

export const reports = pgTable('report', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  dateFrom: text('dateFrom').notNull(),
  dateTo: text('dateTo').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const transactions = pgTable('transaction', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  importId: text('importId')
    .notNull()
    .references(() => imports.id, { onDelete: 'cascade' }),
  date: timestamp('date', { mode: 'date' }).notNull(),
  description: text('description').notNull(),
  categoryId: text('categoryId').references(() => categories.id, {
    onDelete: 'restrict',
  }),
  value: numeric('value', { precision: 14, scale: 2 }).notNull(),
  merchant: text('merchant').notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const importsRelations = relations(imports, ({ one, many }) => ({
  user: one(users, {
    fields: [imports.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  skippedRows: many(importSkippedRows),
}));

export const importSkippedRowsRelations = relations(
  importSkippedRows,
  ({ one }) => ({
    import: one(imports, {
      fields: [importSkippedRows.importId],
      references: [imports.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  import: one(imports, {
    fields: [transactions.importId],
    references: [imports.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
