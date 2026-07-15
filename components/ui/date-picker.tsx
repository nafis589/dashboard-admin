'use client';

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;
  try {
    const date = parseISO(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

function toDateValue(date?: Date): string {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

export function DatePicker({ value, onChange, placeholder = 'Choisir une date', className }: DatePickerProps) {
  const selected = parseDateValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 w-full justify-start px-3 text-left font-normal sm:w-44',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          {selected ? format(selected, 'dd MMM yyyy', { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(toDateValue(date))}
          defaultMonth={selected}
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}
