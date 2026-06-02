import { desc } from 'drizzle-orm';

import { db } from '@/db';
import { reports } from '@/db/schema';

export type ReportListRow = {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  createdAt: Date;
};

export async function getReports(): Promise<ReportListRow[]> {
  return db
    .select({
      id: reports.id,
      name: reports.name,
      dateFrom: reports.dateFrom,
      dateTo: reports.dateTo,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt));
}
