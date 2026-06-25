import {
  formatCalendarDayKey,
  parseCalendarDayKey,
} from '@/lib/dates/calendar-day-key';

export const MAX_SYNCS_PER_DAY = 2;
export const MIN_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const INITIAL_SYNC_DAYS = 90;
export const SYNC_OVERLAP_DAYS = 3;
export const RATE_LIMIT_RETRY_MS = 6 * 60 * 60 * 1000;

export function getUtcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function subtractCalendarDays(dateKey: string, days: number): string {
  const date = parseCalendarDayKey(dateKey);
  if (!date) {
    return dateKey;
  }

  date.setDate(date.getDate() - days);
  return formatCalendarDayKey(date);
}

export function canSyncNow(input: {
  syncsTodayCount: number;
  syncsTodayDate: string | null;
  lastSyncedAt: Date | null;
  syncInProgressAt: Date | null;
  now?: Date;
}): { allowed: true } | { allowed: false; reason: string } {
  const now = input.now ?? new Date();
  const today = getUtcDateKey(now);

  if (input.syncInProgressAt) {
    const lockAge = now.getTime() - input.syncInProgressAt.getTime();
    if (lockAge < 5 * 60 * 1000) {
      return { allowed: false, reason: 'Sync already in progress.' };
    }
  }

  const syncsToday =
    input.syncsTodayDate === today ? input.syncsTodayCount : 0;

  if (syncsToday >= MAX_SYNCS_PER_DAY) {
    return {
      allowed: false,
      reason: 'Daily sync limit reached for this account.',
    };
  }

  if (input.lastSyncedAt) {
    const elapsed = now.getTime() - input.lastSyncedAt.getTime();
    if (elapsed < MIN_SYNC_INTERVAL_MS) {
      return {
        allowed: false,
        reason: 'Last sync was too recent.',
      };
    }
  }

  return { allowed: true };
}

export function nextSyncCount(
  syncsTodayCount: number,
  syncsTodayDate: string | null,
  now = new Date(),
): { syncsTodayCount: number; syncsTodayDate: string } {
  const today = getUtcDateKey(now);
  if (syncsTodayDate === today) {
    return { syncsTodayCount: syncsTodayCount + 1, syncsTodayDate: today };
  }
  return { syncsTodayCount: 1, syncsTodayDate: today };
}
