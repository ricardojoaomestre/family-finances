import {
  GENERIC_IMPORT_PROFILE,
  type BankAccountImportProfile,
} from '@/lib/bank-accounts/import-profile';

export type BankAccountImportProfileResult = {
  profile: BankAccountImportProfile;
  isConfigured: boolean;
};

function stableSerializeProfile(profile: BankAccountImportProfile): string {
  return JSON.stringify(profile);
}

export function isGenericImportProfile(
  profile: BankAccountImportProfile,
): boolean {
  return (
    stableSerializeProfile(profile) ===
    stableSerializeProfile(GENERIC_IMPORT_PROFILE)
  );
}

export function resolveBankAccountImportProfile(
  importProfile: BankAccountImportProfile,
): BankAccountImportProfileResult {
  return {
    profile: importProfile,
    isConfigured: !isGenericImportProfile(importProfile),
  };
}
