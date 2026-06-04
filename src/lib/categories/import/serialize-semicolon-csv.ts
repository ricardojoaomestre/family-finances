export function formatSemicolonCsvField(value: string): string {
  if (value === '') {
    return '';
  }

  const needsQuotes = /[;"\r\n]/.test(value);

  if (!needsQuotes) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function serializeSemicolonCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map(formatSemicolonCsvField).join(';'))
    .join('\n');
}
