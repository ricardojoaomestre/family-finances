'use client';

import { useState } from 'react';
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

type CategoryComboboxOption = {
  id: string;
  name: string;
};

type CategoryComboboxProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  categories: CategoryComboboxOption[];
  noneValue: string;
  noneLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
};

export function CategoryCombobox({
  id,
  value,
  onValueChange,
  categories,
  noneValue,
  noneLabel = 'None',
  placeholder = 'None',
  disabled = false,
  className,
  'aria-invalid': ariaInvalid,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);

  const options: CategoryComboboxOption[] = [
    { id: noneValue, name: noneLabel },
    ...categories,
  ];

  const selected = options.find((option) => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 font-normal shadow-none hover:bg-input/50',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selected?.name ?? placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search category…" />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  data-checked={value === option.id}
                  onSelect={() => {
                    onValueChange(option.id);
                    setOpen(false);
                  }}
                >
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
