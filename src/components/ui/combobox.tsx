'use client';

import { useState, type ReactNode } from 'react';
import { ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ComboboxOption = {
  value: string;
  label: string;
  leading?: ReactNode;
};

export type ComboboxProps = {
  id?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default';
  'aria-label'?: string;
  'aria-invalid'?: boolean;
};

export function Combobox({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results.',
  disabled = false,
  className,
  size = 'default',
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 font-normal shadow-none hover:bg-input/50',
            size === 'sm' ? 'h-10 md:h-8' : 'h-11 md:h-9',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {selected?.leading}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={value === option.value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {option.leading}
                    <span className="truncate">{option.label}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
