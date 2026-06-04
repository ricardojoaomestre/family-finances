import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRightIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  TagsIcon,
  UploadIcon,
} from 'lucide-react';

export type ProtectedNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

export const protectedMainNavItems: ProtectedNavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
  },
  {
    href: '/imports',
    label: 'Import jobs',
    icon: UploadIcon,
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRightIcon,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: FileTextIcon,
    match: (pathname) =>
      pathname === '/reports' ||
      pathname.startsWith('/reports/') ||
      pathname.startsWith('/report/'),
  },
];

export const protectedSettingsNavItems: ProtectedNavItem[] = [
  {
    href: '/settings/categories',
    label: 'Categories',
    icon: TagsIcon,
    match: (pathname) =>
      pathname === '/settings/categories' ||
      pathname.startsWith('/settings/categories/'),
  },
];

export function isProtectedNavItemActive(
  pathname: string,
  item: ProtectedNavItem,
): boolean {
  if (item.match) {
    return item.match(pathname);
  }

  return (
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}
