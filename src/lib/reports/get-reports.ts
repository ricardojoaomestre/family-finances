import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { reports } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type ReportListRow = {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  createdAt: Date;
};

export async function getReports(): Promise<ReportListRow[]> {
  const householdId = await requireActiveHouseholdId();
  return db
    .select({
      id: reports.id,
      name: reports.name,
      dateFrom: reports.dateFrom,
      dateTo: reports.dateTo,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.householdId, householdId))
    .orderBy(desc(reports.createdAt));
}
