const REPORT_NAME_MAX_LENGTH = 80;

export function validateReportName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'Name is required.';
  }

  if (trimmed.length > REPORT_NAME_MAX_LENGTH) {
    return `Name must be ${REPORT_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}
