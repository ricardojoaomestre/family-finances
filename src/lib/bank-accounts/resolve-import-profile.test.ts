import { describe, expect, it } from 'vitest';

import { GENERIC_IMPORT_PROFILE } from '@/lib/bank-accounts/import-profile';
import {
  isGenericImportProfile,
  resolveBankAccountImportProfile,
} from '@/lib/bank-accounts/resolve-import-profile';

describe('resolveBankAccountImportProfile', () => {
  it('marks the generic profile as not configured', () => {
    const result = resolveBankAccountImportProfile(GENERIC_IMPORT_PROFILE);

    expect(result.isConfigured).toBe(false);
    expect(result.profile).toEqual(GENERIC_IMPORT_PROFILE);
  });

  it('marks customized profiles as configured', () => {
    const profile = {
      ...GENERIC_IMPORT_PROFILE,
      descriptionColumns: ['descrição do movimento'],
    };

    const result = resolveBankAccountImportProfile(profile);

    expect(result.isConfigured).toBe(true);
    expect(isGenericImportProfile(profile)).toBe(false);
  });
});
