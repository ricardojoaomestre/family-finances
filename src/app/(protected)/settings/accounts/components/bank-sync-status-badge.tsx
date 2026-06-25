'use client';

import { useSyncExternalStore } from 'react';

import { Badge } from '@/components/ui/badge';
import { formatBankSyncStatus } from '@/lib/bank-connections/format-bank-sync-status';
import type { BankAccountApiLinkRow } from '@/lib/bank-connections/types';

type BankSyncStatusBadgeProps = {
  apiLink: BankAccountApiLinkRow | null;
};

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function BankSyncStatusBadge({ apiLink }: BankSyncStatusBadgeProps) {
  const mounted = useMounted();
  const status = formatBankSyncStatus(apiLink, { useRelativeTime: mounted });

  return <Badge variant={status.variant}>{status.label}</Badge>;
}
