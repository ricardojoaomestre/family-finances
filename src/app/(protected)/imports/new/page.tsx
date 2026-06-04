import Link from 'next/link';

import { FileImport } from '@/app/(protected)/imports/components/file-import';
import { Button } from '@/components/ui/button';

export default function NewImportPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Import file</h1>
          <p className="text-sm text-muted-foreground">
            Upload a CSV or Excel export, review rows, then confirm.
          </p>
        </div>
        <Button variant="outline" className="shrink-0" asChild>
          <Link href="/imports">Back to import jobs</Link>
        </Button>
      </div>
      <FileImport />
    </div>
  );
}
