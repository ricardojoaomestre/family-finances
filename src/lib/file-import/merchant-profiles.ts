import type { BankAccountImportProfile } from '@/lib/bank-accounts/import-profile';
import {
  GENERIC_IMPORT_PROFILE,
  type ImportDateFormat,
  type ImportSignRule,
} from '@/lib/bank-accounts/import-profile';
import type { BankAccountImportProfileResult } from '@/lib/bank-accounts/resolve-import-profile';

export type MerchantImportProfile = BankAccountImportProfile;
export type { ImportDateFormat, ImportSignRule };
export { GENERIC_IMPORT_PROFILE };
export type MerchantProfileResult = BankAccountImportProfileResult;
