'use client';

import { ArchiveIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react';

import { CategoryIcon } from '@/components/categories/category-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableMoneyCell } from '@/components/data-table/table-money-cell';
import { formatDisplayDate } from '@/lib/formatters';
import { noteHasInactiveCategoryWarning } from '@/lib/notes/note-display';
import type { NoteRow } from '@/lib/notes/types';
import { getMerchantLabelOrSlug } from '@/lib/merchants';

type NotesTableProps = {
  notes: NoteRow[];
  archived: boolean;
  disabled?: boolean;
  onEdit?: (note: NoteRow) => void;
  onArchive?: (note: NoteRow) => void;
  onUnarchive?: (note: NoteRow) => void;
  onDelete?: (note: NoteRow) => void;
};

export function NotesTable({
  notes,
  archived,
  disabled = false,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: NotesTableProps) {
  if (notes.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            {archived ? 'No archived notes' : 'No active notes'}
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Merchant</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Context</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notes.map((note) => {
          const showInactiveWarning = noteHasInactiveCategoryWarning(note);

          return (
            <TableRow key={note.id}>
              <TableCell>{formatDisplayDate(note.date)}</TableCell>
              <TableCell>{getMerchantLabelOrSlug(note.merchant)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CategoryIcon
                    icon={note.categoryIcon}
                    color={note.categoryColor}
                  />
                  <span className="truncate">{note.categoryName}</span>
                  {showInactiveWarning ? (
                    <Badge variant="warning">Inactive category</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-muted-foreground">
                {note.context?.trim() || '—'}
              </TableCell>
              <TableCell className="text-right">
                <TableMoneyCell value={Number(note.value)} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {!archived && onEdit ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={disabled}
                      aria-label="Edit note"
                      onClick={() => onEdit(note)}
                    >
                      <PencilIcon />
                    </Button>
                  ) : null}

                  {!archived && onArchive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={disabled}
                      aria-label="Archive note"
                      onClick={() => onArchive(note)}
                    >
                      <ArchiveIcon />
                    </Button>
                  ) : null}

                  {archived && onUnarchive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={disabled}
                      aria-label="Unarchive note"
                      onClick={() => onUnarchive(note)}
                    >
                      <RotateCcwIcon />
                    </Button>
                  ) : null}

                  {archived && onDelete ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={disabled}
                      aria-label="Delete note"
                      onClick={() => onDelete(note)}
                    >
                      <Trash2Icon />
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
