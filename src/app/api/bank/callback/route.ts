import { auth } from '@/auth';
import { getBankAggregatorProvider } from '@/lib/bank/get-bank-aggregator';
import { isBankAggregatorConfigured } from '@/lib/bank/config';
import { parseOAuthState } from '@/lib/bank-connections/oauth-state';
import { upsertBankConnection } from '@/lib/bank-connections/connection-repository';
import { redirect } from 'next/navigation';

function readCallbackParams(request: Request): Record<string, string | null> {
  const url = new URL(request.url);
  const params: Record<string, string | null> = {};

  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

export async function GET(request: Request) {
  if (!isBankAggregatorConfigured()) {
    return htmlResponse(
      503,
      'Bank aggregator not configured',
      'Set BANK_AGGREGATOR_PROVIDER in .env.local.',
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return htmlResponse(
      401,
      'Sign in required',
      'Open the app, sign in, then connect your bank account from Settings → Accounts.',
    );
  }

  const params = readCallbackParams(request);
  const state = params.state?.trim();
  if (!state) {
    return htmlResponse(400, 'Invalid callback', 'Missing OAuth state.');
  }

  const oauthState = parseOAuthState(state);
  if (!oauthState) {
    return htmlResponse(400, 'Invalid callback', 'OAuth state could not be verified.');
  }

  try {
    const provider = getBankAggregatorProvider();
    const result = await provider.completeConnection({ callbackParams: params });
    const { connection, accessValidUntil } = result;

    const saved = await upsertBankConnection({
      householdId: oauthState.householdId,
      providerId: provider.id,
      externalSessionId: connection.id,
      institutionId: connection.institutionId,
      connectedByUserId: session.user.id,
      accessValidUntil: accessValidUntil ? new Date(accessValidUntil) : null,
      status: 'linked',
    });

    redirect(
      `/settings/accounts?pendingBankAccountId=${encodeURIComponent(oauthState.bankAccountId)}&pendingConnectionId=${encodeURIComponent(saved.id)}`,
    );
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : 'Unknown bank aggregator error';

    return htmlResponse(500, 'Bank connection callback failed', message);
  }
}

function htmlResponse(status: number, title: string, message: string): Response {
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; }
      h1 { font-size: 1.5rem; }
      p { line-height: 1.5; color: #444; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p><a href="/settings/accounts">Back to accounts</a></p>
  </body>
</html>`;

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
