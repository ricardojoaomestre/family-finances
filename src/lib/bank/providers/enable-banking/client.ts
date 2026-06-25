import {
  getEnableBankingApiBaseUrl,
  getEnableBankingAppId,
  getEnableBankingPrivateKey,
} from '@/lib/bank/providers/enable-banking/env';
import { createEnableBankingJwt } from '@/lib/bank/providers/enable-banking/jwt';
import type {
  EnableBankingAuthorizeSessionResponse,
  EnableBankingBalancesResponse,
  EnableBankingGetAspspsResponse,
  EnableBankingGetSessionResponse,
  EnableBankingStartAuthorizationResponse,
  EnableBankingTransaction,
  EnableBankingTransactionsResponse,
} from '@/lib/bank/providers/enable-banking/types';

export type EnableBankingPsuHeaders = {
  'Psu-Ip-Address'?: string;
  'Psu-User-Agent'?: string;
  'Psu-Accept'?: string;
  'Psu-Accept-Language'?: string;
};

type EnableBankingRequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  searchParams?: Record<string, string | undefined>;
  psuHeaders?: EnableBankingPsuHeaders;
};

export class EnableBankingClient {
  private readonly appId: string;
  private readonly privateKeyPem: string;

  constructor(
    appId = getEnableBankingAppId(),
    privateKeyPem = getEnableBankingPrivateKey(),
  ) {
    this.appId = appId;
    this.privateKeyPem = privateKeyPem;
  }

  listAspsps(countryCode?: string): Promise<EnableBankingGetAspspsResponse> {
    return this.request<EnableBankingGetAspspsResponse>('/aspsps', {
      searchParams: countryCode ? { country: countryCode.toUpperCase() } : undefined,
    });
  }

  startAuthorization(input: {
    aspspName: string;
    aspspCountry: string;
    redirectUrl: string;
    state: string;
    validUntil: string;
    language?: string;
    psuType?: 'personal' | 'business';
  }): Promise<EnableBankingStartAuthorizationResponse> {
    return this.request<EnableBankingStartAuthorizationResponse>('/auth', {
      method: 'POST',
      body: {
        access: {
          valid_until: input.validUntil,
          balances: true,
          transactions: true,
        },
        aspsp: {
          name: input.aspspName,
          country: input.aspspCountry.toUpperCase(),
        },
        state: input.state,
        redirect_url: input.redirectUrl,
        psu_type: input.psuType ?? 'personal',
        language: input.language?.toLowerCase(),
      },
    });
  }

  authorizeSession(code: string): Promise<EnableBankingAuthorizeSessionResponse> {
    return this.request<EnableBankingAuthorizeSessionResponse>('/sessions', {
      method: 'POST',
      body: { code },
    });
  }

  getSession(sessionId: string): Promise<EnableBankingGetSessionResponse> {
    return this.request<EnableBankingGetSessionResponse>(
      `/sessions/${encodeURIComponent(sessionId)}`,
    );
  }

  getAccountDetails(accountId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/accounts/${encodeURIComponent(accountId)}/details`,
    );
  }

  getAccountBalances(
    accountId: string,
    psuHeaders?: EnableBankingPsuHeaders,
  ): Promise<EnableBankingBalancesResponse> {
    return this.request<EnableBankingBalancesResponse>(
      `/accounts/${encodeURIComponent(accountId)}/balances`,
      { psuHeaders },
    );
  }

  getAccountTransactions(input: {
    accountId: string;
    dateFrom?: string;
    dateTo?: string;
    continuationKey?: string;
    strategy?: 'default' | 'longest';
    psuHeaders?: EnableBankingPsuHeaders;
  }): Promise<EnableBankingTransactionsResponse> {
    return this.request<EnableBankingTransactionsResponse>(
      `/accounts/${encodeURIComponent(input.accountId)}/transactions`,
      {
        searchParams: {
          date_from: input.dateFrom,
          date_to: input.dateTo,
          continuation_key: input.continuationKey,
          strategy: input.strategy,
        },
        psuHeaders: input.psuHeaders,
      },
    );
  }

  getAccountTransaction(input: {
    accountId: string;
    transactionId: string;
  }): Promise<EnableBankingTransaction> {
    return this.request<EnableBankingTransaction>(
      `/accounts/${encodeURIComponent(input.accountId)}/transactions/${encodeURIComponent(input.transactionId)}`,
    );
  }

  private async request<T>(
    path: string,
    options: EnableBankingRequestOptions = {},
  ): Promise<T> {
    const url = new URL(`${getEnableBankingApiBaseUrl()}${path}`);

    if (options.searchParams) {
      for (const [key, value] of Object.entries(options.searchParams)) {
        if (value) {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${createEnableBankingJwt(this.appId, this.privateKeyPem)}`,
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...filterPsuHeaders(options.psuHeaders),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new EnableBankingRequestError(
        response.status,
        await readEnableBankingErrorPayload(response),
      );
    }

    return (await response.json()) as T;
  }
}

export class EnableBankingRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: Record<string, unknown>;

  constructor(
    status: number,
    payload: {
      message: string;
      code?: string;
      detail?: Record<string, unknown>;
    },
  ) {
    super(payload.message);
    this.name = 'EnableBankingRequestError';
    this.status = status;
    this.code = payload.code;
    this.detail = payload.detail;
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.message.includes('ASPSP_RATE_LIMIT_EXCEEDED');
  }

  get wrongTransactionsPeriodDateFrom(): string | null {
    if (this.code !== 'WRONG_TRANSACTIONS_PERIOD') {
      return null;
    }

    const dateFrom = this.detail?.date_from;
    return typeof dateFrom === 'string' ? dateFrom : null;
  }
}

function filterPsuHeaders(
  psuHeaders?: EnableBankingPsuHeaders,
): Record<string, string> {
  if (!psuHeaders) return {};

  return Object.fromEntries(
    Object.entries(psuHeaders).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
}

async function readEnableBankingErrorPayload(response: Response): Promise<{
  message: string;
  code?: string;
  detail?: Record<string, unknown>;
}> {
  const text = await response.text();

  try {
    const payload = JSON.parse(text) as {
      message?: string;
      error?: string;
      detail?: Record<string, unknown> | string;
      code?: string;
    };
    const detail =
      payload.detail && typeof payload.detail === 'object'
        ? payload.detail
        : undefined;
    const parts = [
      payload.message,
      payload.code,
      payload.error,
      typeof payload.detail === 'string' ? payload.detail : undefined,
      `HTTP ${response.status}`,
    ].filter(Boolean);

    return {
      message: parts.join(' — '),
      code: payload.code,
      detail,
    };
  } catch {
    return {
      message: text || `Enable Banking request failed with HTTP ${response.status}`,
    };
  }
}
