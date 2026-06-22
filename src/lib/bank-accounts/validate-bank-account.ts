import type { BankAccountImportProfile } from '@/lib/bank-accounts/import-profile';
import { GENERIC_IMPORT_PROFILE } from '@/lib/bank-accounts/import-profile';

const BANK_ACCOUNT_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BANK_ACCOUNT_LABEL_MAX_LENGTH = 80;

export function validateBankAccountSlug(slug: string): string | null {
  const trimmed = slug.trim().toLowerCase();

  if (!trimmed) {
    return 'Slug is required.';
  }

  if (!BANK_ACCOUNT_SLUG_RE.test(trimmed)) {
    return 'Use lowercase letters, numbers, and hyphens only.';
  }

  return null;
}

export function validateBankAccountLabel(label: string): string | null {
  const trimmed = label.trim();

  if (!trimmed) {
    return 'Label is required.';
  }

  if (trimmed.length > BANK_ACCOUNT_LABEL_MAX_LENGTH) {
    return `Label must be ${BANK_ACCOUNT_LABEL_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}

export function normalizeBankAccountSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function normalizeBankAccountLabel(label: string): string {
  return label.trim();
}

export function parseBankAccountImportProfile(
  value: unknown,
): BankAccountImportProfile | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Partial<BankAccountImportProfile>;

  if (
    !Array.isArray(record.dateColumns) ||
    !Array.isArray(record.descriptionColumns) ||
    typeof record.dateFormat !== 'string' ||
    typeof record.signRule !== 'string'
  ) {
    return null;
  }

  return {
    dateColumns: record.dateColumns.map(String),
    descriptionColumns: record.descriptionColumns.map(String),
    valueColumns: record.valueColumns?.map(String),
    debitColumns: record.debitColumns?.map(String),
    creditColumns: record.creditColumns?.map(String),
    balanceColumns: record.balanceColumns?.map(String),
    dateFormat: record.dateFormat as BankAccountImportProfile['dateFormat'],
    signRule: record.signRule as BankAccountImportProfile['signRule'],
    minHeaderRow:
      typeof record.minHeaderRow === 'number' ? record.minHeaderRow : undefined,
    skipRowPatterns: record.skipRowPatterns?.map(String),
  };
}

export function createDefaultBankAccountImportProfile(): BankAccountImportProfile {
  return structuredClone(GENERIC_IMPORT_PROFILE);
}

const IMPORT_DATE_FORMATS = new Set<BankAccountImportProfile['dateFormat']>([
  'DMY',
  'YMD',
  'auto',
]);

const IMPORT_SIGN_RULES = new Set<BankAccountImportProfile['signRule']>([
  'as-is',
  'debit-negative',
  'credit-positive',
  'invert',
]);

export type BankAccountImportProfileFormInput = {
  dateColumns: string;
  descriptionColumns: string;
  valueColumns: string;
  debitColumns: string;
  creditColumns: string;
  balanceColumns: string;
  dateFormat: string;
  signRule: string;
  minHeaderRow: string;
  skipRowPatterns: string;
};

export type BankAccountImportProfileFormField =
  keyof BankAccountImportProfileFormInput;

function splitColumnList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function bankAccountImportProfileToFormInput(
  profile: BankAccountImportProfile,
): BankAccountImportProfileFormInput {
  return {
    dateColumns: profile.dateColumns.join(', '),
    descriptionColumns: profile.descriptionColumns.join(', '),
    valueColumns: profile.valueColumns?.join(', ') ?? '',
    debitColumns: profile.debitColumns?.join(', ') ?? '',
    creditColumns: profile.creditColumns?.join(', ') ?? '',
    balanceColumns: profile.balanceColumns?.join(', ') ?? '',
    dateFormat: profile.dateFormat,
    signRule: profile.signRule,
    minHeaderRow:
      profile.minHeaderRow !== undefined ? String(profile.minHeaderRow) : '',
    skipRowPatterns: profile.skipRowPatterns?.join(', ') ?? '',
  };
}

export function validateBankAccountImportProfileForm(
  input: BankAccountImportProfileFormInput,
): Partial<Record<BankAccountImportProfileFormField, string>> {
  const fieldErrors: Partial<
    Record<BankAccountImportProfileFormField, string>
  > = {};

  if (splitColumnList(input.dateColumns).length === 0) {
    fieldErrors.dateColumns = 'Add at least one date column name.';
  }

  if (splitColumnList(input.descriptionColumns).length === 0) {
    fieldErrors.descriptionColumns =
      'Add at least one description column name.';
  }

  if (
    !IMPORT_DATE_FORMATS.has(
      input.dateFormat as BankAccountImportProfile['dateFormat'],
    )
  ) {
    fieldErrors.dateFormat = 'Select a valid date format.';
  }

  if (
    !IMPORT_SIGN_RULES.has(input.signRule as BankAccountImportProfile['signRule'])
  ) {
    fieldErrors.signRule = 'Select a valid sign rule.';
  }

  const minHeaderRow = input.minHeaderRow.trim();

  if (minHeaderRow !== '') {
    const parsed = Number(minHeaderRow);

    if (!Number.isInteger(parsed) || parsed < 0) {
      fieldErrors.minHeaderRow = 'Enter a whole number zero or greater.';
    }
  }

  return fieldErrors;
}

export function parseBankAccountImportProfileForm(
  input: BankAccountImportProfileFormInput,
): BankAccountImportProfile | null {
  const fieldErrors = validateBankAccountImportProfileForm(input);

  if (Object.keys(fieldErrors).length > 0) {
    return null;
  }

  const valueColumns = splitColumnList(input.valueColumns);
  const debitColumns = splitColumnList(input.debitColumns);
  const creditColumns = splitColumnList(input.creditColumns);
  const balanceColumns = splitColumnList(input.balanceColumns);
  const skipRowPatterns = splitColumnList(input.skipRowPatterns);
  const minHeaderRow = input.minHeaderRow.trim();

  return {
    dateColumns: splitColumnList(input.dateColumns),
    descriptionColumns: splitColumnList(input.descriptionColumns),
    valueColumns: valueColumns.length > 0 ? valueColumns : undefined,
    debitColumns: debitColumns.length > 0 ? debitColumns : undefined,
    creditColumns: creditColumns.length > 0 ? creditColumns : undefined,
    balanceColumns: balanceColumns.length > 0 ? balanceColumns : undefined,
    dateFormat: input.dateFormat as BankAccountImportProfile['dateFormat'],
    signRule: input.signRule as BankAccountImportProfile['signRule'],
    minHeaderRow:
      minHeaderRow !== '' ? Number.parseInt(minHeaderRow, 10) : undefined,
    skipRowPatterns:
      skipRowPatterns.length > 0 ? skipRowPatterns : undefined,
  };
}
