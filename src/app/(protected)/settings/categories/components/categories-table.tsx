'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, PencilIcon } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type Ref,
} from 'react';

import { CategoryTypeBadge } from '@/app/(protected)/settings/categories/components/category-type-badge';
import { CategoryIcon } from '@/components/categories/category-icon';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CategoryRow } from '@/lib/categories/get-categories';

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

type CategoriesTableProps = {
  categories: CategoryRow[];
  disabled?: boolean;
  reorderDisabled?: boolean;
  onEdit: (category: CategoryRow) => void;
  onReorder: (orderedIds: string[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  onToggleActive: (id: string, active: boolean) => void;
};

type CategoryTableRowProps = {
  category: CategoryRow;
  index: number;
  disabled: boolean;
  dragDisabled?: boolean;
  onEdit: (category: CategoryRow) => void;
  onToggleActive: (id: string, active: boolean) => void;
  rowRef?: Ref<HTMLTableRowElement>;
  rowStyle?: CSSProperties;
  dragHandleProps?: React.ComponentProps<'button'>;
};

function CategoryTableRow({
  category,
  index,
  disabled,
  dragDisabled = false,
  onEdit,
  onToggleActive,
  rowRef,
  rowStyle,
  dragHandleProps,
}: CategoryTableRowProps) {
  return (
    <TableRow ref={rowRef} style={rowStyle}>
      <TableCell className="w-10">
        <button
          type="button"
          className="-m-3 flex size-11 cursor-grab touch-none items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 md:size-9 md:-m-2"
          disabled={dragDisabled}
          aria-label={`Reorder ${category.name}`}
          {...dragHandleProps}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      </TableCell>
      <TableCell className="hidden w-12 md:table-cell">
        <span className="tabular-nums text-muted-foreground">{index + 1}</span>
      </TableCell>
      <TableCell className="w-12">
        <CategoryIcon icon={category.icon} color={category.color} />
      </TableCell>
      <TableCell>
        <span className="block truncate font-medium">{category.name}</span>
      </TableCell>
      <TableCell className="hidden w-28 sm:table-cell">
        <CategoryTypeBadge type={category.type} />
      </TableCell>
      <TableCell className="w-20">
        <Switch
          checked={category.active}
          disabled={disabled}
          aria-label={`Toggle ${category.name}`}
          onCheckedChange={(checked) => onToggleActive(category.id, checked)}
        />
      </TableCell>
      <TableCell className="w-14 sm:w-24">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onEdit(category)}
          aria-label={`Edit ${category.name}`}
        >
          <PencilIcon />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function SortableCategoryRow(props: Omit<CategoryTableRowProps, 'rowRef' | 'rowStyle' | 'dragHandleProps'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.category.id, disabled: props.disabled });

  return (
    <CategoryTableRow
      {...props}
      dragDisabled={props.disabled}
      rowRef={setNodeRef}
      rowStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

function CategoriesTableBody({
  items,
  disabled,
  sortable,
  onEdit,
  onToggleActive,
}: {
  items: CategoryRow[];
  disabled: boolean;
  sortable: boolean;
  onEdit: (category: CategoryRow) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  if (!items.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={7} className="p-0">
            <Empty className="border-0 py-12">
              <EmptyHeader>
                <EmptyTitle>No results</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {items.map((category, index) =>
        sortable ? (
          <SortableCategoryRow
            key={category.id}
            category={category}
            index={index}
            disabled={disabled}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
          />
        ) : (
          <CategoryTableRow
            key={category.id}
            category={category}
            index={index}
            disabled={disabled}
            dragDisabled
            onEdit={onEdit}
            onToggleActive={onToggleActive}
          />
        ),
      )}
    </TableBody>
  );
}

function categoriesMatch(a: CategoryRow[], b: CategoryRow[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => {
    const other = b[index];
    return (
      item.id === other.id &&
      item.name === other.name &&
      item.description === other.description &&
      item.color === other.color &&
      item.pattern === other.pattern &&
      item.priority === other.priority &&
      item.active === other.active &&
      item.type === other.type
    );
  });
}

export function CategoriesTable({
  categories,
  disabled = false,
  reorderDisabled = false,
  onEdit,
  onReorder,
  onToggleActive,
}: CategoriesTableProps) {
  const [items, setItems] = useState(categories);
  const [isReordering, setIsReordering] = useState(false);
  const isReorderingRef = useRef(false);
  const sortable = useIsClient() && !reorderDisabled;

  useEffect(() => {
    isReorderingRef.current = isReordering;
  }, [isReordering]);

  useEffect(() => {
    if (isReorderingRef.current) {
      return;
    }

    setItems((current) =>
      categoriesMatch(current, categories) ? current : categories,
    );
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextItems = arrayMove(items, oldIndex, newIndex);
    const previousItems = items;

    setItems(nextItems);
    setIsReordering(true);

    const result = await onReorder(nextItems.map((item) => item.id));

    setIsReordering(false);

    if (!result.ok) {
      setItems(previousItems);
    }
  }

  const rowProps = {
    items,
    disabled: disabled || isReordering,
    onEdit,
    onToggleActive,
  };

  const table = (
    <div className="overflow-hidden rounded-md border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">Reorder</span>
            </TableHead>
            <TableHead className="hidden w-12 md:table-cell">#</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Color</span>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden w-28 sm:table-cell">Type</TableHead>
            <TableHead className="w-20">Active</TableHead>
            <TableHead className="w-14 sm:w-24">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        {sortable ? (
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <CategoriesTableBody {...rowProps} sortable />
          </SortableContext>
        ) : (
          <CategoriesTableBody {...rowProps} sortable={false} />
        )}
      </Table>
    </div>
  );

  if (!sortable) {
    return table;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {table}
    </DndContext>
  );
}
