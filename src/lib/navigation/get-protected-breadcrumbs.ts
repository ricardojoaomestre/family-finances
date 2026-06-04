export type ProtectedBreadcrumb = {
  label: string;
  href?: string;
};

export function getProtectedBreadcrumbs(
  pathname: string,
): ProtectedBreadcrumb[] {
  if (pathname === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  if (pathname === '/imports' || pathname.startsWith('/imports/')) {
    if (pathname === '/imports') {
      return [{ label: 'Import jobs' }];
    }
    if (pathname === '/imports/new') {
      return [
        { label: 'Import jobs', href: '/imports' },
        { label: 'New import' },
      ];
    }
    return [
      { label: 'Import jobs', href: '/imports' },
      { label: 'Import detail' },
    ];
  }

  if (pathname === '/transactions') {
    return [{ label: 'Transactions' }];
  }

  if (pathname === '/reports') {
    return [{ label: 'Reports' }];
  }

  if (pathname === '/report/new') {
    return [
      { label: 'Reports', href: '/reports' },
      { label: 'New report' },
    ];
  }

  if (pathname.startsWith('/reports/')) {
    return [
      { label: 'Reports', href: '/reports' },
      { label: 'Report' },
    ];
  }

  if (pathname.startsWith('/settings')) {
    if (pathname === '/settings/categories') {
      return [
        { label: 'Settings' },
        { label: 'Categories' },
      ];
    }
    return [{ label: 'Settings' }];
  }

  return [{ label: 'App' }];
}
