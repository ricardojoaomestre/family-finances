import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { reports } from '@/db/schema';

export type ReportRow = {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getReportById(id: string): Promise<ReportRow | null> {
  const [row] = await db
    .select({
      id: reports.id,
      name: reports.name,
      dateFrom: reports.dateFrom,
      dateTo: reports.dateTo,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);

  return row ?? null;
}
