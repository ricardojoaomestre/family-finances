import { describe, expect, it } from 'vitest';

import { formatImportJobLabel } from '@/lib/imports/format-import-job-label';
import {
  canSyncNow,
  getUtcDateKey,
  nextSyncCount,
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
