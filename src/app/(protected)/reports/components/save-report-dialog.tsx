'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatReportMonth } from '@/lib/reports/report-month';

type SaveReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  dateFrom: string;
  dateTo: string;
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
};

export function SaveReportDialog({
  open,
  onOpenChange,
  name,
  dateFrom,
  dateTo,
  isPending,
  error,
  onConfirm,
}: SaveReportDialogProps) {
  void dateTo;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save report?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Review the report details before saving.</p>
              <dl className="grid gap-1 rounded-md border bg-muted/30 p-3 text-foreground">
                <div>
                  <dt className="sr-only">Name</dt>
                  <dd className="font-medium">{name}</dd>
                </div>
                <div>
                  <dt className="sr-only">Month</dt>
                  <dd>{formatReportMonth(dateFrom)}</dd>
                </div>
              </dl>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? 'Saving…' : 'Save'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
