type PostgresErrorLike = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
};

function getPostgresError(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== 'object') return null;

  const record = error as Record<string, unknown>;
  const direct = record as PostgresErrorLike;
  if (direct.code) return direct;

  const cause = record.cause;
  if (cause && typeof cause === 'object') {
    return getPostgresError(cause);
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export function isMissingRelationError(
  error: unknown,
  relation: string,
): boolean {
  const pg = getPostgresError(error);

  if (pg?.code === '42P01') {
    return true;
  }

  const message = getErrorMessage(error);
  return message.includes(relation);
}

export function formatDbError(error: unknown, context: string): string {
  const message = getErrorMessage(error);
  const pg = getPostgresError(error);

  if (message.includes('No transactions support in neon-http')) {
    return `${context}: database driver cannot run transactions. This is a server configuration issue — contact the developer.`;
  }

  if (pg?.code === '23503') {
    if (pg.constraint?.includes('userId')) {
      return `${context}: your user account was not found in the database. Sign out, sign in again, then retry the import.`;
    }
    return `${context}: a related record is missing (${pg.detail ?? 'foreign key violation'}). Sign out and sign in again, then retry.`;
  }

  if (pg?.code === '42P01') {
    return `${context}: required database tables are missing. Run \`npm run db:migrate\` against your database, then retry.`;
  }

  if (pg?.code === '23505') {
    return `${context}: duplicate data conflict. Refresh the page and try again.`;
  }

  if (pg?.code === '22P02' || message.toLowerCase().includes('invalid input syntax')) {
    return `${context}: one or more values could not be stored (invalid number or date format). Check your spreadsheet and try again.`;
  }

  if (message.includes('DATABASE_URL')) {
    return `${context}: database is not configured. Set DATABASE_URL in your environment and restart the app.`;
  }

  const detail = pg?.detail ? ` (${pg.detail})` : '';
  return `${context}: ${message}${detail}`;
}
