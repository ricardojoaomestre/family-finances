'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { useProtectedPage } from '@/app/(protected)/components/protected-page-context';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getProtectedBreadcrumbs } from '@/lib/navigation/get-protected-breadcrumbs';

export function ProtectedBreadcrumbs() {
  const pathname = usePathname();
  const { title } = useProtectedPage();
  const segments = getProtectedBreadcrumbs(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const label =
            isLast && title ? title : segment.label;

          return (
            <Fragment key={`${segment.label}-${index}`}>
              {index > 0 ? (
                <BreadcrumbSeparator className="hidden md:block" />
              ) : null}
              <BreadcrumbItem
                className={
                  !isLast && index === 0 ? 'hidden md:block' : undefined
                }
              >
                {isLast ? (
                  <BreadcrumbPage className="min-w-0 break-all font-semibold text-foreground">
                    {label}
                  </BreadcrumbPage>
                ) : segment.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{segment.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
