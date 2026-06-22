import { describe, expect, it } from 'vitest';

import { pickActiveHouseholdId } from '@/lib/household/pick-active-household-id';

describe('pickActiveHouseholdId', () => {
  it('returns null when the user has no memberships', () => {
    expect(pickActiveHouseholdId('household-a', [])).toBeNull();
    expect(pickActiveHouseholdId(null, [])).toBeNull();
  });

  it('returns the stored active household when membership is valid', () => {
    expect(
      pickActiveHouseholdId('household-b', ['household-a', 'household-b']),
    ).toBe('household-b');
  });

  it('falls back to the oldest membership when no active household is stored', () => {
    expect(
      pickActiveHouseholdId(null, ['household-a', 'household-b']),
    ).toBe('household-a');
  });

  it('falls back to the oldest membership when the stored active household is stale', () => {
    expect(
      pickActiveHouseholdId('household-removed', [
        'household-a',
        'household-b',
      ]),
    ).toBe('household-a');
  });

  it('ignores blank active household values', () => {
    expect(pickActiveHouseholdId('', ['household-a'])).toBe('household-a');
  });
});
