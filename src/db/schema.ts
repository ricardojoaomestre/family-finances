import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { CategoryIconName } from '@/lib/categories/category-icon-names';
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
  activeHouseholdId: text('activeHouseholdId').references(
    (): typeof households.id => households.id,
    { onDelete: 'set null' },
  ),
});

export const households = pgTable('household', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  primaryAccountMerchant: text('primaryAccountMerchant'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const householdMemberRoleEnum = ['owner', 'member'] as const;
export type HouseholdMemberRole = (typeof householdMemberRoleEnum)[number];

export const householdMembers = pgTable(
  'household_member',
  {
    householdId: text('householdId')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role')
      .$type<HouseholdMemberRole>()
      .notNull()
      .default('member'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.householdId, table.userId] }),
  ],
);

export const householdInviteStatusEnum = [
  'pending',
  'accepted',
  'revoked',
] as const;
export type HouseholdInviteStatus =
  (typeof householdInviteStatusEnum)[number];

export const householdInvites = pgTable(
  'household_invite',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text('householdId')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role')
      .$type<HouseholdMemberRole>()
      .notNull()
      .default('member'),
    token: text('token').notNull().unique(),
    status: text('status')
      .$type<HouseholdInviteStatus>()
      .notNull()
      .default('pending'),
    invitedByUserId: text('invitedByUserId').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }),
  },
  (table) => [
    uniqueIndex('household_invite_pending_email_idx')
      .on(table.householdId, table.email)
      .where(sql`${table.status} = 'pending'`),
  ],
);

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

export const categories = pgTable(
  'category',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text('householdId')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').notNull(),
    icon: text('icon').$type<CategoryIconName>().notNull().default('tag'),
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
  },
  (table) => [
    uniqueIndex('category_household_name_idx').on(
      table.householdId,
      table.name,
    ),
  ],
);


export const budgetPeriodEnum = ['monthly'] as const;
export type BudgetPeriod = (typeof budgetPeriodEnum)[number];

export const budgets = pgTable(
  'budget',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text('householdId')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    categoryId: text('categoryId')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    period: text('period')
      .$type<BudgetPeriod>()
      .notNull()
      .default('monthly'),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('budget_household_category_idx').on(
      table.householdId,
      table.categoryId,
    ),
  ],
);

export const categoryImportSnapshots = pgTable('category_import_snapshot', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  householdId: text('householdId')
    .notNull()
    .unique()
    .references(() => households.id, { onDelete: 'cascade' }),
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
  householdId: text('householdId')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
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
  householdId: text('householdId')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
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

export const notes = pgTable(
  'note',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text('householdId')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    merchant: text('merchant').notNull(),
    date: timestamp('date', { mode: 'date' }).notNull(),
    value: numeric('value', { precision: 14, scale: 2 }).notNull(),
    categoryId: text('categoryId')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    context: text('context'),
    archivedAt: timestamp('archivedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('note_active_merchant_date_value_idx')
      .on(table.householdId, table.merchant, table.date, table.value)
      .where(sql`${table.archivedAt} is null`),
  ],
);

export const transactions = pgTable('transaction', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  householdId: text('householdId')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  importId: text('importId')
    .notNull()
    .references(() => imports.id, { onDelete: 'cascade' }),
  date: timestamp('date', { mode: 'date' }).notNull(),
  description: text('description').notNull(),
  categoryId: text('categoryId').references(() => categories.id, {
    onDelete: 'restrict',
  }),
  value: numeric('value', { precision: 14, scale: 2 }).notNull(),
  balance: numeric('balance', { precision: 14, scale: 2 }),
  merchant: text('merchant').notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(householdMembers),
  invites: many(householdInvites),
  categories: many(categories),
  budgets: many(budgets),
  imports: many(imports),
  notes: many(notes),
  reports: many(reports),
  transactions: many(transactions),
}));

export const householdMembersRelations = relations(
  householdMembers,
  ({ one }) => ({
    household: one(households, {
      fields: [householdMembers.householdId],
      references: [households.id],
    }),
    user: one(users, {
      fields: [householdMembers.userId],
      references: [users.id],
    }),
  }),
);

export const householdInvitesRelations = relations(
  householdInvites,
  ({ one }) => ({
    household: one(households, {
      fields: [householdInvites.householdId],
      references: [households.id],
    }),
    invitedBy: one(users, {
      fields: [householdInvites.invitedByUserId],
      references: [users.id],
    }),
  }),
);

export const importsRelations = relations(imports, ({ one, many }) => ({
  user: one(users, {
    fields: [imports.userId],
    references: [users.id],
  }),
  household: one(households, {
    fields: [imports.householdId],
    references: [households.id],
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
  notes: many(notes),
  budgets: many(budgets),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  household: one(households, {
    fields: [budgets.householdId],
    references: [households.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  category: one(categories, {
    fields: [notes.categoryId],
    references: [categories.id],
  }),
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
