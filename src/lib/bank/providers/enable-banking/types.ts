export type EnableBankingAspsp = {
  name: string;
  country: string;
  maximum_consent_validity?: number;
};

export type EnableBankingGetAspspsResponse = {
  aspsps: EnableBankingAspsp[];
};

export type EnableBankingStartAuthorizationResponse = {
  url: string;
  authorization_id: string;
};

export type EnableBankingAccountResource = {
  uid?: string;
  name?: string;
  details?: string;
  currency?: string;
  account_id?: {
    iban?: string;
  };
  account_servicer?: {
    name?: string;
  };
};

export type EnableBankingAuthorizeSessionResponse = {
  session_id: string;
  accounts: EnableBankingAccountResource[];
  aspsp?: EnableBankingAspsp;
  access?: {
    valid_until?: string;
  };
};

export type EnableBankingGetSessionResponse = {
  session_id?: string;
  accounts?: string[];
  aspsp?: EnableBankingAspsp;
  access?: {
    valid_until?: string;
  };
  status?: string;
};

export type EnableBankingAmount = {
  currency?: string;
  amount?: string;
};

export type EnableBankingPartyIdentification = {
  name?: string;
};

export type EnableBankingFinancialInstitutionIdentification = {
  name?: string;
};

export type EnableBankingBankTransactionCode = {
  description?: string;
  code?: string;
  sub_code?: string;
};

export type EnableBankingTransaction = {
  entry_reference?: string;
  transaction_id?: string;
  booking_date?: string;
  value_date?: string;
  transaction_date?: string;
  transaction_amount?: EnableBankingAmount;
  credit_debit_indicator?: 'CRDT' | 'DBIT';
  status?: string;
  remittance_information?: string[] | string;
  bank_transaction_code?: EnableBankingBankTransactionCode;
  creditor?: EnableBankingPartyIdentification;
  debtor?: EnableBankingPartyIdentification;
  creditor_agent?: EnableBankingFinancialInstitutionIdentification;
  debtor_agent?: EnableBankingFinancialInstitutionIdentification;
  reference_number?: string;
  reference_number_schema?: string;
  merchant_category_code?: string;
  note?: string;
  balance_after_transaction?: EnableBankingAmount;
};

export type EnableBankingTransactionsResponse = {
  transactions?: EnableBankingTransaction[];
  continuation_key?: string | null;
};

export type EnableBankingBalance = {
  name?: string;
  balance_amount?: EnableBankingAmount;
  balance_type?: string;
};

export type EnableBankingBalancesResponse = {
  balances?: EnableBankingBalance[];
};
