'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export type DateRange = { from: string; to: string }

type Preset = 'all' | 'today' | 'yesterday' | 'last7days' | 'lastMonth' | 'lastYear' | 'custom'

const formatDate = (date: Date) => {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function rangeFor(preset: Preset): DateRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (preset === 'today') return { from: formatDate(today), to: formatDate(today) }
  if (preset === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    return { from: formatDate(yesterday), to: formatDate(yesterday) }
  }
  if (preset === 'last7days') {
    const from = new Date(today)
    from.setDate(today.getDate() - 6)
    return { from: formatDate(from), to: formatDate(today) }
  }
  if (preset === 'lastMonth') {
    const from = new Date(today)
    from.setMonth(today.getMonth() - 1)
    return { from: formatDate(from), to: formatDate(today) }
  }
  if (preset === 'lastYear') {
    const from = new Date(today)
    from.setFullYear(today.getFullYear() - 1)
    return { from: formatDate(from), to: formatDate(today) }
  }
  return { from: '', to: '' }
}

function displayDate(iso: string) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

function toIsoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  const candidate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return candidate.getUTCFullYear() === Number(year) && candidate.getUTCMonth() === Number(month) - 1 && candidate.getUTCDate() === Number(day)
    ? `${year}-${month}-${day}`
    : null
}

function DateTextInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [text, setText] = useState(() => displayDate(value))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState(() => value ? new Date(`${value}T00:00:00`) : new Date())

  useEffect(() => {
    setText(displayDate(value))
    if (value) setDisplayMonth(new Date(`${value}T00:00:00`))
  }, [value])

  const commit = () => {
    if (!text.trim()) { onChange(''); return }
    const parsed = toIsoDate(text)
    if (parsed) onChange(parsed)
    else setText(displayDate(value))
  }

  const selectDate = (date: Date | undefined) => {
    if (!date) return
    setText(displayDate(formatDate(date)))
    onChange(formatDate(date))
    setPickerOpen(false)
  }

  // Calendar controls remain English in every locale; the selected value is
  // still written to the date field as DD/MM/YYYY.
  const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2020, index, 1)))
  const setYear = (year: string) => {
    const parsed = Number(year)
    if (Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100) setDisplayMonth(new Date(parsed, displayMonth.getMonth(), 1))
  }

  return (
    <div className="relative">
      <input aria-label={label} type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={text}
        onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger aria-label={`${label} calendar`} className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <CalendarDays className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[18rem] gap-0 p-0">
          <div className="flex items-center justify-center gap-2 border-b border-border p-3">
            <button type="button" onClick={() => setMonthPickerOpen(open => !open)} className="h-8 w-28 rounded-md border border-border bg-background px-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
              {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(displayMonth)}
            </button>
            <input aria-label="Year" type="number" min="1900" max="2100" value={displayMonth.getFullYear()}
              onChange={e => setYear(e.target.value)} className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {monthPickerOpen ? (
            <div className="grid grid-cols-3 gap-1 p-3">
              {months.map((month, index) => <button key={month} type="button" onClick={() => { setDisplayMonth(new Date(displayMonth.getFullYear(), index, 1)); setMonthPickerOpen(false) }}
                className={`rounded-md px-2 py-2 text-sm ${displayMonth.getMonth() === index ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{month}</button>)}
            </div>
          ) : <Calendar mode="single" month={displayMonth} onMonthChange={setDisplayMonth} hideNavigation className="w-full"
            classNames={{
              month_caption: 'hidden', nav: 'hidden', month: 'flex w-full flex-col gap-2',
              weekdays: 'flex w-full', weekday: 'flex-1 text-center text-[0.8rem] font-normal pb-1 text-muted-foreground',
              week: 'flex w-full', day: 'relative flex flex-1 items-center justify-center p-0',
            }}
            selected={value ? new Date(`${value}T00:00:00`) : undefined} onSelect={selectDate} />}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function DateFilter({ value, onChange, className = '' }: {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<Preset>(value.from || value.to ? 'custom' : 'all')
  const bn = locale === 'bn'

  useEffect(() => {
    if (!value.from && !value.to) setPreset('all')
  }, [value.from, value.to])

  const labels: Record<Preset, string> = bn ? {
    all: 'সব সময়', today: 'আজ', yesterday: 'গতকাল', last7days: 'গত ৭ দিন',
    lastMonth: 'গত মাস', lastYear: 'গত বছর', custom: 'কাস্টম তারিখ',
  } : {
    all: 'Any date', today: 'Today', yesterday: 'Yesterday', last7days: 'Last 7 days',
    lastMonth: 'Last month', lastYear: 'Last year', custom: 'Custom date',
  }

  const selectPreset = (next: Preset) => {
    setPreset(next)
    onChange(next === 'custom' ? value : rangeFor(next))
    if (next !== 'custom') setOpen(false)
  }

  const activeLabel = preset === 'all' ? (bn ? 'তারিখ' : 'Date') : labels[preset]

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={bn ? 'তারিখ দিয়ে ফিল্টার করুন' : 'Filter by date'}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-muted px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-28 truncate">{activeLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-3">
          <p className="px-1 pb-2 text-sm font-medium">{bn ? 'তারিখ অনুযায়ী দেখুন' : 'Filter by date'}</p>
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(labels).filter(key => key !== 'all') as Preset[]).map(key => (
              <button key={key} type="button" onClick={() => selectPreset(key)}
                className={`rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${preset === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                {labels[key]}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <DateTextInput label={bn ? 'শুরুর তারিখ' : 'Start date'} value={value.from} onChange={from => onChange({ ...value, from })} />
              <DateTextInput label={bn ? 'শেষ তারিখ' : 'End date'} value={value.to} onChange={to => onChange({ ...value, to })} />
            </div>
          )}
          {(value.from || value.to) && <button type="button" onClick={() => { setPreset('all'); onChange({ from: '', to: '' }); setOpen(false) }}
            className="mt-3 inline-flex items-center gap-1.5 px-1 text-sm text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />{bn ? 'তারিখের ফিল্টার মুছুন' : 'Clear date filter'}
          </button>}
        </PopoverContent>
      </Popover>
    </div>
  )
}
