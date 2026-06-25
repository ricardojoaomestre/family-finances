import { eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  bankAccountApiLinks,
  bankAccounts,
  bankConnections,
  type BankSyncStatus,
} from '@/db/schema';
import type { BankAccountApiLinkRow } from '@/lib/bank-connections/types';

function mapApiLinkRow(
  link: typeof bankAccountApiLinks.$inferSelect,
  connection: typeof bankConnections.$inferSelect,
): BankAccountApiLinkRow {
  return {
    id: link.id,
    bankAccountId: link.bankAccountId,
    connectionId: link.connectionId,
    externalAccountId: link.externalAccountId,
    accountIban: link.accountIban,
    accountName: link.accountName,
    linkedAt: link.linkedAt,
    lastSyncedAt: link.lastSyncedAt,
    lastSyncStatus: link.lastSyncStatus,
    lastSyncError: link.lastSyncError,
    lastSyncImportId: link.lastSyncImportId,
    syncsTodayCount: link.syncsTodayCount,
    syncsTodayDate: link.syncsTodayDate,
    syncInProgressAt: link.syncInProgressAt,
    providerId: connection.providerId,
    externalSessionId: connection.externalSessionId,
    accessValidUntil: connection.accessValidUntil,
    connectionStatus: connection.status,
  };
}

export async function getApiLinkForBankAccount(
  bankAccountId: string,
): Promise<BankAccountApiLinkRow | null> {
  const [row] = await db
    .select({
      link: bankAccountApiLinks,
      connection: bankConnections,
    })
    .from(bankAccountApiLinks)
    .innerJoin(
      bankConnections,
      eq(bankAccountApiLinks.connectionId, bankConnections.id),
    )
    .where(eq(bankAccountApiLinks.bankAccountId, bankAccountId))
    .limit(1);

  if (!row) {
    return null;
  }

  return mapApiLinkRow(row.link, row.connection);
}

export async function getApiLinksForHousehold(
  householdId: string,
): Promise<BankAccountApiLinkRow[]> {
  const rows = await db
    .select({
      link: bankAccountApiLinks,
      connection: bankConnections,
    })
    .from(bankAccountApiLinks)
    .innerJoin(
      bankConnections,
      eq(bankAccountApiLinks.connectionId, bankConnections.id),
    )
    .innerJoin(bankAccounts, eq(bankAccountApiLinks.bankAccountId, bankAccounts.id))
    .where(eq(bankAccounts.householdId, householdId));

  return rows.map((row) => mapApiLinkRow(row.link, row.connection));
}

export async function getApiLinkMapForHousehold(
  householdId: string,
): Promise<Map<string, BankAccountApiLinkRow>> {
  const links = await getApiLinksForHousehold(householdId);
  return new Map(links.map((link) => [link.bankAccountId, link]));
}

export async function updateApiLinkSyncState(
  linkId: string,
  input: {
    lastSyncedAt?: Date | null;
    lastSyncStatus?: BankSyncStatus | null;
    lastSyncError?: string | null;
    lastSyncImportId?: string | null;
    syncsTodayCount?: number;
    syncsTodayDate?: string | null;
    syncInProgressAt?: Date | null;
  },
): Promise<void> {
  await db
    .update(bankAccountApiLinks)
    .set(input)
    .where(eq(bankAccountApiLinks.id, linkId));
}
