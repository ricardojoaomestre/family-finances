import { describe, expect, it } from 'vitest';

import { formatImportJobLabel } from '@/lib/imports/format-import-job-label';
import {
  INITIAL_SYNC_DAYS,
  buildSyncDateRange,
  canSyncNow,
  getUtcDateKey,
  nextSyncCount,
  subtractCalendarDays,
} from '@/lib/bank-connections/sync-quota';

describe('formatImportJobLabel', () => {
  it('formats API imports with period', () => {
    expect(
      formatImportJobLabel({
        source: 'api',
        filename: null,
        periodFrom: '2026-01-01',
        periodTo: '2026-01-31',
      }),
    ).toBe('API · 2026-01-01 → 2026-01-31');
  });

  it('formats file imports with filename', () => {
    expect(
      formatImportJobLabel({
        source: 'file',
        filename: 'extrato.csv',
        periodFrom: null,
        periodTo: null,
      }),
    ).toBe('extrato.csv');
  });
});

describe('buildSyncDateRange', () => {
  it('uses a long lookback for the first sync', () => {
    const now = new Date('2026-07-10T15:00:00Z');
    expect(buildSyncDateRange(null, now)).toEqual({
      dateFrom: subtractCalendarDays('2026-07-10', INITIAL_SYNC_DAYS),
      dateTo: '2026-07-10',
    });
  });

  it('starts the next sync on the previous sync to-day', () => {
    const lastSyncedAt = new Date('2026-07-05T18:30:00Z');
    const now = new Date('2026-07-10T12:00:00Z');

    expect(buildSyncDateRange(lastSyncedAt, now)).toEqual({
      dateFrom: '2026-07-05',
      dateTo: '2026-07-10',
    });
  });

  it('does not subtract a multi-day overlap lookback', () => {
    const lastSyncedAt = new Date('2026-07-05T08:00:00Z');
    const now = new Date('2026-07-10T08:00:00Z');
    const range = buildSyncDateRange(lastSyncedAt, now);

    expect(range.dateFrom).toBe('2026-07-05');
    expect(range.dateFrom).not.toBe('2026-07-02');
    expect(range.dateFrom).not.toBe('2026-07-03');
  });
});

describe('sync quota', () => {
  it('allows first sync of the day', () => {
    expect(
      canSyncNow({
        syncsTodayCount: 0,
        syncsTodayDate: null,
        lastSyncedAt: null,
        syncInProgressAt: null,
      }).allowed,
    ).toBe(true);
  });

  it('blocks when daily limit reached', () => {
    const today = getUtcDateKey();
    expect(
      canSyncNow({
        syncsTodayCount: 2,
        syncsTodayDate: today,
        lastSyncedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
        syncInProgressAt: null,
      }).allowed,
    ).toBe(false);
  });

  it('resets counter on a new UTC day', () => {
    const counter = nextSyncCount(2, '2026-01-01', new Date('2026-01-02T10:00:00Z'));
    expect(counter).toEqual({
      syncsTodayCount: 1,
      syncsTodayDate: '2026-01-02',
    });
  });
});
