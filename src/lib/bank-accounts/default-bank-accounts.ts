import {
  GENERIC_IMPORT_PROFILE,
  type BankAccountImportProfile,
} from '@/lib/bank-accounts/import-profile';

export type DefaultBankAccountSeed = {
  slug: string;
  label: string;
  importProfile: BankAccountImportProfile;
};

const CONFIGURED_IMPORT_PROFILES: Record<string, BankAccountImportProfile> = {
  'activo-debito-ricardo': {
    ...GENERIC_IMPORT_PROFILE,
    dateColumns: ['data lanc.'],
    signRule: 'debit-negative',
    dateFormat: 'DMY',
  },
  'activo-debito-joana': {
    ...GENERIC_IMPORT_PROFILE,
    dateColumns: ['data lanc.'],
    signRule: 'debit-negative',
    dateFormat: 'DMY',
  },
  'activo-credito-ricardo': {
    ...GENERIC_IMPORT_PROFILE,
    dateColumns: ['data lanc.'],
    signRule: 'invert',
    dateFormat: 'DMY',
  },
  'santander-refeicao': {
    ...GENERIC_IMPORT_PROFILE,
    dateColumns: ['data operação'],
    signRule: 'debit-negative',
    dateFormat: 'DMY',
  },
  bpi: {
    ...GENERIC_IMPORT_PROFILE,
    descriptionColumns: ['descrição do movimento'],
    valueColumns: ['valor em eur', 'valor movimento'],
    balanceColumns: ['saldo em eur'],
    dateFormat: 'DMY',
    signRule: 'debit-negative',
  },
};

const DEFAULT_BANK_ACCOUNT_LABELS: Record<string, string> = {
  'activo-credito-ricardo': 'Activo Bank - crédito - Ricardo',
  'activo-debito-joana': 'Activo Bank - débito - Joana',
  'activo-debito-ricardo': 'Activo Bank - débito - Ricardo',
  bpi: 'BPI',
  coverflex: 'Coverflex',
  'santander-credito': 'Santander - crédito',
  'santander-debito': 'Santander - débito',
  'santander-refeicao': 'Santander - cartão refeição',
  ticket: 'Ticket',
};

export const DEFAULT_BANK_ACCOUNT_SLUGS = Object.keys(
  DEFAULT_BANK_ACCOUNT_LABELS,
) as string[];

export function getDefaultImportProfileForSlug(
  slug: string,
): BankAccountImportProfile {
  return CONFIGURED_IMPORT_PROFILES[slug] ?? GENERIC_IMPORT_PROFILE;
}

export function getDefaultBankAccountSeeds(): DefaultBankAccountSeed[] {
  return DEFAULT_BANK_ACCOUNT_SLUGS.map((slug) => ({
    slug,
    label: DEFAULT_BANK_ACCOUNT_LABELS[slug]!,
    importProfile: getDefaultImportProfileForSlug(slug),
  }));
}

export const DEFAULT_PRIMARY_BANK_ACCOUNT_SLUG = 'bpi';
