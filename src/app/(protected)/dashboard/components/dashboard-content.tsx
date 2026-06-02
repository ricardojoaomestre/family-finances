'use client';

import FileImport from '@/app/(protected)/dashboard/components/file-import';

export function DashboardContent() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <FileImport />
    </div>
  );
}
