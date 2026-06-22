'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function ThemeIcon({ theme }: { theme: string | undefined }) {
  if (theme === 'dark') {
    return <Moon className="size-4" />;
  }

  if (theme === 'light') {
    return <Sun className="size-4" />;
  }

  return <Monitor className="size-4" />;
}

export function ThemeModeMenuSubmenu() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={!mounted}>
        <ThemeIcon theme={theme} />
        Theme
      </DropdownMenuSubTrigger>
      {mounted ? (
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      ) : null}
    </DropdownMenuSub>
  );
}
