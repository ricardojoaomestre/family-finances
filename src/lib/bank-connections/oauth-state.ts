import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

type OAuthStatePayload = {
  bankAccountId: string;
  householdId: string;
  nonce: string;
};

function getOAuthStateSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error('AUTH_SECRET is required for bank OAuth state signing.');
  }
  return secret;
}

export function createOAuthState(input: {
  bankAccountId: string;
  householdId: string;
}): string {
  const payload: OAuthStatePayload = {
    bankAccountId: input.bankAccountId,
    householdId: input.householdId,
    nonce: randomBytes(16).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getOAuthStateSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function parseOAuthState(
  state: string,
): OAuthStatePayload | null {
  const [encoded, signature] = state.split('.');
  if (!encoded || !signature) {
    return null;
  }

  const expected = createHmac('sha256', getOAuthStateSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as OAuthStatePayload;

    if (!payload.bankAccountId || !payload.householdId || !payload.nonce) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
