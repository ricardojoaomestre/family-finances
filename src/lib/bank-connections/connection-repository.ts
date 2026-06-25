import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  bankAccountApiLinks,
  bankConnections,
  type BankConnectionStatus,
} from '@/db/schema';

export type UpsertBankConnectionInput = {
  householdId: string;
  providerId: string;
  externalSessionId: string;
  institutionId?: string | null;
  connectedByUserId: string;
  accessValidUntil?: Date | null;
  status?: BankConnectionStatus;
};

export async function upsertBankConnection(
  input: UpsertBankConnectionInput,
): Promise<{ id: string }> {
  const existing = await db
    .select({ id: bankConnections.id })
    .from(bankConnections)
    .where(
      and(
        eq(bankConnections.householdId, input.householdId),
        eq(bankConnections.externalSessionId, input.externalSessionId),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existing[0]) {
    await db
      .update(bankConnections)
      .set({
        providerId: input.providerId,
        institutionId: input.institutionId ?? null,
        connectedByUserId: input.connectedByUserId,
        accessValidUntil: input.accessValidUntil ?? null,
        status: input.status ?? 'linked',
        updatedAt: now,
      })
      .where(eq(bankConnections.id, existing[0].id));

    return { id: existing[0].id };
  }

  const id = crypto.randomUUID();
  await db.insert(bankConnections).values({
    id,
    householdId: input.householdId,
    providerId: input.providerId,
    externalSessionId: input.externalSessionId,
    institutionId: input.institutionId ?? null,
    connectedByUserId: input.connectedByUserId,
    accessValidUntil: input.accessValidUntil ?? null,
    status: input.status ?? 'linked',
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export type SaveBankAccountApiLinkInput = {
  bankAccountId: string;
  connectionId: string;
  externalAccountId: string;
  accountIban?: string | null;
  accountName?: string | null;
};

export async function saveBankAccountApiLink(
  input: SaveBankAccountApiLinkInput,
): Promise<{ id: string }> {
  const existing = await db
    .select({ id: bankAccountApiLinks.id })
    .from(bankAccountApiLinks)
    .where(eq(bankAccountApiLinks.bankAccountId, input.bankAccountId))
    .limit(1);

  const now = new Date();

  if (existing[0]) {
    await db
      .update(bankAccountApiLinks)
      .set({
        connectionId: input.connectionId,
        externalAccountId: input.externalAccountId.trim(),
        accountIban: input.accountIban?.trim() || null,
        accountName: input.accountName?.trim() || null,
        linkedAt: now,
        lastSyncStatus: null,
        lastSyncError: null,
        syncInProgressAt: null,
      })
      .where(eq(bankAccountApiLinks.id, existing[0].id));

    return { id: existing[0].id };
  }

  const id = crypto.randomUUID();
  await db.insert(bankAccountApiLinks).values({
    id,
    bankAccountId: input.bankAccountId,
    connectionId: input.connectionId,
    externalAccountId: input.externalAccountId.trim(),
    accountIban: input.accountIban?.trim() || null,
    accountName: input.accountName?.trim() || null,
    linkedAt: now,
  });

  return { id };
}

export async function deleteBankAccountApiLink(
  bankAccountId: string,
): Promise<void> {
  await db
    .delete(bankAccountApiLinks)
    .where(eq(bankAccountApiLinks.bankAccountId, bankAccountId));
}

export async function getBankConnectionById(connectionId: string) {
  const [row] = await db
    .select()
    .from(bankConnections)
    .where(eq(bankConnections.id, connectionId))
    .limit(1);

  return row ?? null;
}
