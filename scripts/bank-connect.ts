import { randomUUID } from 'node:crypto';

import { loadBankEnv } from '@/lib/bank/load-env';
import { getBankAggregatorRedirectUrl } from '@/lib/bank/config';
import { findBankInstitutionByName } from '@/lib/bank/find-institution-by-name';
import { getBankAggregatorProvider } from '@/lib/bank/get-bank-aggregator';

const BANK_ALIASES: Record<string, string> = {
  bpi: 'bpi',
  activo: 'activo',
  'activo-bank': 'activo',
  santander: 'santander',
};

function parseArgs(argv: string[]) {
  const bankIndex = argv.indexOf('--bank');
  const institutionIndex = argv.indexOf('--institution');
  const countryIndex = argv.indexOf('--country');

  const bank = bankIndex >= 0 ? argv[bankIndex + 1]?.trim().toLowerCase() : undefined;
  const institution =
    institutionIndex >= 0 ? argv[institutionIndex + 1]?.trim() : undefined;
  const country = countryIndex >= 0 ? argv[countryIndex + 1]?.trim() : 'PT';

  if (!bank && !institution) {
    throw new Error(
      'Usage: npm run bank:connect -- --bank bpi|activo [--country PT]\n       npm run bank:connect -- --institution "Banco BPI" [--country PT]',
    );
  }

  return {
    country,
    query: institution ?? BANK_ALIASES[bank ?? ''] ?? bank ?? '',
  };
}

async function main() {
  loadBankEnv();

  const { country, query } = parseArgs(process.argv.slice(2));
  const provider = getBankAggregatorProvider();
  const institutions = await provider.listInstitutions(country);
  const institution = findBankInstitutionByName(institutions, query);

  if (!institution) {
    console.error(`Could not find a bank matching "${query}" in ${country}.`);
    console.error('Available institutions:');
    for (const candidate of institutions.sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      console.error(`- ${candidate.name} (${candidate.id})`);
    }
    process.exit(1);
  }

  const redirectUrl = getBankAggregatorRedirectUrl();
  const reference = randomUUID();
  const result = await provider.startConnection({
    institutionId: institution.id,
    redirectUrl,
    reference,
    maxHistoricalDays: institution.maxHistoricalDays,
    userLanguage: 'PT',
  });

  console.log('Provider:', provider.displayName);
  console.log('Institution:', institution.name, `(${institution.id})`);
  console.log('Redirect URL:', redirectUrl);
  console.log('Authorization id:', result.connectionId);
  console.log('');
  console.log('Before connecting, ensure accounts are whitelisted in Enable Banking Control Panel.');
  console.log('Start the dev server with HTTPS: npm run dev:https');
  console.log('');
  console.log('Open this link and complete bank authentication:');
  console.log(result.authUrl);
  console.log('');
  console.log(
    'After auth, the callback saves .bank/local-state.json. Then run: npm run bank:fetch (or pass --from/--to for a specific period).',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
