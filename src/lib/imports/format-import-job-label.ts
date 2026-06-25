import type { ImportSource } from '@/db/schema';

export type ImportJobLabelInput = {
  source: ImportSource;
  filename: string | null;
  periodFrom: string | null;
  periodTo: string | null;
};

export function formatImportJobLabel(input: ImportJobLabelInput): string {
  if (input.source === 'api') {
    if (input.periodFrom && input.periodTo) {
      return `API · ${input.periodFrom} → ${input.periodTo}`;
    }

    if (input.periodFrom) {
      return `API · from ${input.periodFrom}`;
    }

    if (input.periodTo) {
      return `API · until ${input.periodTo}`;
    }

    return 'API import';
  }

  return input.filename?.trim() || 'Unknown file';
}
