import type { BankSyncStatus } from '@/db/schema';

export type BankAccountApiLinkRow = {
  id: string;
  bankAccountId: string;
  connectionId: string;
  externalAccountId: string;
  accountIban: string | null;
  accountName: string | null;
  linkedAt: Date;
  lastSyncedAt: Date | null;
  lastSyncStatus: BankSyncStatus | null;
  lastSyncError: string | null;
  lastSyncImportId: string | null;
  syncsTodayCount: number;
  syncsTodayDate: string | null;
  syncInProgressAt: Date | null;
  providerId: string;
  externalSessionId: string;
  accessValidUntil: Date | null;
  connectionStatus: string;
};

export type BankAccountWithApiLink = {
  id: string;
  slug: string;
  label: string;
  apiLink: BankAccountApiLinkRow | null;
};
