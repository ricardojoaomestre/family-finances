import type { MerchantSlug } from "@/lib/merchants";

export type ImportDateFormat = "DMY" | "YMD" | "auto";
export type ImportSignRule =
  | "as-is"
  | "debit-negative"
  | "credit-positive"
  | "invert";

export type MerchantImportProfile = {
  dateColumns: string[];
  descriptionColumns: string[];
  valueColumns?: string[];
  debitColumns?: string[];
  creditColumns?: string[];
  balanceColumns?: string[];
  dateFormat: ImportDateFormat;
  signRule: ImportSignRule;
  minHeaderRow?: number;
  skipRowPatterns?: string[];
};

export type MerchantProfileResult = {
  profile: MerchantImportProfile;
  isConfigured: boolean;
};

export const GENERIC_IMPORT_PROFILE: MerchantImportProfile = {
  dateColumns: [
    "date",
    "data",
    "data mov.",
    "data mov",
    "data valor",
    "data movimento",
    "dt. operação",
    "dt operação",
  ],
  descriptionColumns: [
    "description",
    "descrição",
    "descricao",
    "movimento",
    "detalhe",
    "detalhes",
    "descritivo",
  ],
  valueColumns: ["value", "valor", "montante", "importe", "amount"],
  debitColumns: ["débito", "debito", "debit"],
  creditColumns: ["crédito", "credito", "credit"],
  balanceColumns: ["balance", "saldo"],
  dateFormat: "auto",
  signRule: "as-is",
};

const MERCHANT_IMPORT_PROFILES: Partial<
  Record<MerchantSlug, MerchantImportProfile>
> = {
  "activo-debito-ricardo": {
    ...GENERIC_IMPORT_PROFILE,
    dateColumns: ["data lanc."],
    signRule: "debit-negative",
    dateFormat: "DMY",
  },
  "activo-debito-joana": {
    ...GENERIC_IMPORT_PROFILE,
    dateColumns: ["data lanc."],
    signRule: "debit-negative",
    dateFormat: "DMY",
  },
  "activo-credito-ricardo": {
    ...GENERIC_IMPORT_PROFILE,
    dateColumns: ["data lanc."],
    signRule: "invert",
    dateFormat: "DMY",
  },
  bpi: {
    ...GENERIC_IMPORT_PROFILE,
    descriptionColumns: ["descrição do movimento"],
    valueColumns: ['valor em eur', 'valor movimento'],
    balanceColumns: ["saldo em eur"],
    dateFormat: "DMY",
    signRule: "debit-negative",
  },
};

export function getMerchantImportProfile(
  merchant: MerchantSlug,
): MerchantProfileResult {
  const profile = MERCHANT_IMPORT_PROFILES[merchant];

  if (profile) {
    return { profile, isConfigured: true };
  }

  return { profile: GENERIC_IMPORT_PROFILE, isConfigured: false };
}
