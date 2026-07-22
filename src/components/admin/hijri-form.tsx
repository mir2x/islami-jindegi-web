'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ArrowLeft, CalendarIcon } from 'lucide-react'
import { format, parse } from 'date-fns'
import { toast } from 'sonner'
import { useHijriStore } from '@/store/hijri-store'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { HijriMonthSighting } from '@/types'

// Bangla spellings are the canonical set shared 1:1 with the dotnet API's
// HijriService.MonthNames and the app's l10n — keep all three in sync.
const HIJRI_MONTHS = [
  { value: 1,  en: 'Muharram',        bn: 'মুহাররম' },
  { value: 2,  en: 'Safar',           bn: 'সফর' },
  { value: 3,  en: "Rabi' al-Awwal",  bn: 'রবিউল আউয়াল' },
  { value: 4,  en: "Rabi' al-Thani",  bn: 'রবিউস সানি' },
  { value: 5,  en: 'Jumada al-Ula',   bn: 'জুমাদাল উলা' },
  { value: 6,  en: 'Jumada al-Thani', bn: 'জুমাদাল উখরা' },
  { value: 7,  en: 'Rajab',           bn: 'রজব' },
  { value: 8,  en: "Sha'ban",         bn: 'শাবান' },
  { value: 9,  en: 'Ramadan',         bn: 'রমাযান' },
  { value: 10, en: 'Shawwal',         bn: 'শাউয়াল' },
  { value: 11, en: "Dhu al-Qi'dah",   bn: 'যিলক্বদ' },
  { value: 12, en: 'Dhu al-Hijjah',   bn: 'যিলহাজ্জ' },
]

const COMMON_COUNTRIES = ['BD', 'SA', 'PK', 'IN', 'AU', 'GB', 'US', 'MY', 'ID', 'NG']

interface Props {
  item?: HijriMonthSighting | null
}

export function HijriForm({ item }: Props) {
  const router = useRouter()
  const { create, update } = useHijriStore()
  const isEdit = !!item

  const [countryCode, setCountryCode] = useState(item?.countryCode ?? 'BD')
  const [hijriYear, setHijriYear] = useState(String(item?.hijriYear ?? ''))
  const [hijriMonth, setHijriMonth] = useState(String(item?.hijriMonth ?? ''))
  const [gregorianStartDate, setGregorianStartDate] = useState(item?.gregorianStartDate ?? '')
  const [loading, setLoading] = useState(false)

  // Populate defaults from the live Hijri date API (current month → default to next month)
  useEffect(() => {
    if (item) {
      setCountryCode(item.countryCode)
      setHijriYear(String(item.hijriYear))
      setHijriMonth(String(item.hijriMonth))
      setGregorianStartDate(item.gregorianStartDate)
      return
    }
    const base = process.env.NEXT_PUBLIC_API_URL ?? ''
    fetch(`${base}/api/hijri/date?country-code=BD`)
      .then(r => r.json())
      .then((data: { data: { hijriYear: number; hijriMonth: number } }) => {
        setHijriYear(String(data.data.hijriYear))
        setHijriMonth(String(data.data.hijriMonth))
      })
      .catch(() => {
        // Fallback: hardcode known current year if API unavailable
        setHijriYear('1447')
        setHijriMonth('1')
      })
  }, [item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const year = parseInt(hijriYear, 10)
    const month = parseInt(hijriMonth, 10)

    if (!countryCode.trim()) { toast.error('Country code is required'); return }
    if (isNaN(year) || year < 1300 || year > 1600) { toast.error('Hijri year must be between 1300 and 1600'); return }
    if (isNaN(month) || month < 1 || month > 12) { toast.error('Hijri month must be 1–12'); return }
    if (!gregorianStartDate) { toast.error('Gregorian start date is required'); return }

    setLoading(true)
    try {
      const payload = {
        countryCode: countryCode.toUpperCase().trim(),
        hijriYear: year,
        hijriMonth: month,
        gregorianStartDate,
      }

      if (isEdit) {
        await update(item.id, payload)
        toast.success('Sighting updated')
      } else {
        await create(payload)
        toast.success('Sighting created')
      }
      router.push('/admin/hijri')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('409') || msg.toLowerCase().includes('conflict')) {
        toast.error('A sighting for this country/year/month already exists')
      } else {
        toast.error('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedMonth = HIJRI_MONTHS.find(m => m.value === parseInt(hijriMonth))

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Hijri Sighting' : 'Add Hijri Sighting'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Override the Gregorian start date for a Hijri month in a specific country.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sighting Details</h2>

          {/* Country code */}
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country Code</Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={v => v && setCountryCode(v)}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="countryCode"
                value={countryCode}
                onChange={e => setCountryCode(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="Custom (e.g. TR)"
                className="flex-1 bg-background"
              />
            </div>
            <p className="text-xs text-muted-foreground">ISO 3166-1 alpha-2 country code. BD, SA, PK, IN, AU use a default +1 day offset if no override exists.</p>
          </div>

          {/* Hijri year */}
          <div className="space-y-2">
            <Label htmlFor="hijriYear">Hijri Year</Label>
            <Input
              id="hijriYear"
              type="number"
              value={hijriYear}
              onChange={e => setHijriYear(e.target.value)}
              placeholder="e.g. 1447"
              min={1300}
              max={1600}
              className="bg-background"
            />
          </div>

          {/* Hijri month */}
          <div className="space-y-2">
            <Label>Hijri Month</Label>
            <Select value={hijriMonth} onValueChange={v => v && setHijriMonth(v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select month">
                  {selectedMonth && (
                    <span>{selectedMonth.value}. {selectedMonth.en} — {selectedMonth.bn}</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {HIJRI_MONTHS.map(m => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.value}. {m.en} — {m.bn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gregorian start date */}
          <div className="space-y-2">
            <Label>Gregorian Start Date</Label>
            <Popover>
              <PopoverTrigger
                className={cn(
                  'flex h-10 w-full items-center justify-start gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !gregorianStartDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="h-4 w-4 shrink-0" />
                {gregorianStartDate
                  ? format(parse(gregorianStartDate, 'yyyy-MM-dd', new Date()), 'PPP')
                  : 'Pick a date'}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={gregorianStartDate ? parse(gregorianStartDate, 'yyyy-MM-dd', new Date()) : undefined}
                  onSelect={d => setGregorianStartDate(d ? format(d, 'yyyy-MM-dd') : '')}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">The Gregorian date on which this Hijri month begins in this country (moon sighting date).</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Sighting' : 'Create Sighting'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
