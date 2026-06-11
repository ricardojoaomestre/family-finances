import Link from 'next/link';

import { FileImport } from '@/app/(protected)/imports/components/file-import';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function NewImportPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Import file"
        description="Upload a CSV or Excel export, review rows, then confirm."
        actions={
          <Button variant="outline" asChild>
            <Link href="/imports">Back to import jobs</Link>
          </Button>
        }
      />
      <FileImport />
    </div>
  );
}
