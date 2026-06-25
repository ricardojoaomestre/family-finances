import { formatDistanceToNow } from 'date-fns';

import type { BankAccountApiLinkRow } from '@/lib/bank-connections/types';

export function formatBankSyncStatus(
  apiLink: BankAccountApiLinkRow | null,
  options: { useRelativeTime?: boolean } = {},
): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (!apiLink) {
    return { label: 'Not connected', variant: 'secondary' };
  }

  if (
    apiLink.accessValidUntil &&
    apiLink.accessValidUntil.getTime() <= Date.now()
  ) {
    return { label: 'Connection expired', variant: 'destructive' };
  }

  if (apiLink.lastSyncStatus === 'rate_limited') {
    return { label: 'Rate limited', variant: 'destructive' };
  }

  if (apiLink.lastSyncStatus === 'session_expired') {
    return { label: 'Reconnect required', variant: 'destructive' };
  }

  if (apiLink.lastSyncStatus === 'failed') {
    return { label: 'Sync failed', variant: 'destructive' };
  }

  if (apiLink.lastSyncedAt) {
    const timeLabel = options.useRelativeTime
      ? formatDistanceToNow(apiLink.lastSyncedAt, { addSuffix: true })
      : null;

    return {
      label: timeLabel ? `Synced ${timeLabel}` : 'Synced',
      variant: 'default',
    };
  }

  return { label: 'Connected', variant: 'outline' };
}
