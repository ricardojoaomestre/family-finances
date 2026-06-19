import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { reports } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type ReportRow = {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getReportById(id: string): Promise<ReportRow | null> {
  const householdId = await requireActiveHouseholdId();
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
    .where(and(eq(reports.id, id), eq(reports.householdId, householdId)))
    .limit(1);

  return row ?? null;
}
