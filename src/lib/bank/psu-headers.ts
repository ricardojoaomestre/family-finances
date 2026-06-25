import { headers } from 'next/headers';

export type PsuHeaders = {
  'Psu-Ip-Address'?: string;
  'Psu-User-Agent'?: string;
  'Psu-Accept'?: string;
  'Psu-Accept-Language'?: string;
};

export async function readPsuHeadersFromRequest(): Promise<PsuHeaders> {
  const headerList = await headers();
  const result: PsuHeaders = {};

  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    undefined;
  const userAgent = headerList.get('user-agent') ?? undefined;
  const accept = headerList.get('accept') ?? undefined;
  const acceptLanguage = headerList.get('accept-language') ?? undefined;

  if (ip) result['Psu-Ip-Address'] = ip;
  if (userAgent) result['Psu-User-Agent'] = userAgent;
  if (accept) result['Psu-Accept'] = accept;
  if (acceptLanguage) result['Psu-Accept-Language'] = acceptLanguage;

  return result;
}

export function hasPsuHeaders(psuHeaders: PsuHeaders): boolean {
  return Object.values(psuHeaders).some(Boolean);
}
