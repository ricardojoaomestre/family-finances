'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Trash2Icon } from 'lucide-react';

import { deleteReport } from '@/app/(protected)/reports/actions/report-actions';
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
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatReportMonth } from '@/lib/reports/report-month';
import type { ReportListRow } from '@/lib/reports/get-reports';

type ReportsTableProps = {
  reports: ReportListRow[];
};

export function ReportsTable({ reports }: ReportsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ReportListRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteReport(deleteTarget.id);

      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }

      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-40">Month</TableHead>
              <TableHead className="w-16">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <Link
                    href={`/reports/${report.id}`}
                    className="font-medium hover:underline"
                  >
                    {report.name}
                  </Link>
                </TableCell>
                <TableCell>{formatReportMonth(report.dateFrom)}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    aria-label={`Delete ${report.name}`}
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(report);
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be permanently removed. Transaction data is not affected.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
