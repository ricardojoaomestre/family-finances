'use client';

import Link from 'next/link';
import { useState } from 'react';

import FileImport from '@/app/(protected)/dashboard/components/file-import';
import { ImportJobsTable } from '@/app/(protected)/imports/components/import-jobs-table';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import type { ImportJobRow } from '@/lib/imports/get-imports';

type DashboardContentProps = {
  recentImports: ImportJobRow[];
};

export function DashboardContent({ recentImports }: DashboardContentProps) {
  const [previewActive, setPreviewActive] = useState(false);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <FileImport onPreviewChange={setPreviewActive} />
      {!previewActive && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Recent imports</h2>
            <Link
              href="/imports"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          {recentImports.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No imports yet</EmptyTitle>
                <EmptyDescription>
                  Upload a file above to create your first import.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ImportJobsTable data={recentImports} paginate={false} />
          )}
        </section>
      )}
    </div>
  );
}
