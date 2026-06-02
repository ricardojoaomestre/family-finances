'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/imports', label: 'Import jobs' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
] as const;

export function ProtectedNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          pathname.startsWith(`${link.href}/`) ||
          (link.href === '/reports' &&
            (pathname.startsWith('/report/') ||
              pathname.startsWith('/reports/')));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
