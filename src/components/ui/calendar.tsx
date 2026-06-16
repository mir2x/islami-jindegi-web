'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-2',
        month_caption: 'flex justify-center items-center h-8 relative',
        caption_label: 'text-sm font-medium',
        nav: 'absolute inset-x-0 flex justify-between px-0.5 pointer-events-none',
        button_previous: 'pointer-events-auto h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
        button_next: 'pointer-events-auto h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground w-8 text-center text-[0.8rem] font-normal pb-1',
        weeks: 'flex flex-col gap-1 mt-1',
        week: 'flex',
        day: 'relative p-0 flex items-center justify-center',
        day_button: cn(
          'h-8 w-8 rounded-md text-sm font-normal transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        ),
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:font-semibold',
        outside: '[&>button]:text-muted-foreground [&>button]:opacity-40',
        disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed',
        range_start: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-l-md',
        range_end: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-r-md',
        range_middle: '[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
