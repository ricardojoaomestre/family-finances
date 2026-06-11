'use client';

import { ProtectedBreadcrumbs } from '@/app/(protected)/components/protected-breadcrumbs';
import { useProtectedPage } from '@/app/(protected)/components/protected-page-context';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function ProtectedTopBar() {
  const { description, actions } = useProtectedPage();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex shrink-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <div
          aria-hidden="true"
          className="h-4 w-px shrink-0 bg-border"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0">
        <ProtectedBreadcrumbs />
        {description ? (
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
