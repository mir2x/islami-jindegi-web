'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  MapPin, Moon, Sunrise, Sun, Sunset,
  Clock, TriangleAlert, ChevronRight, Loader2,
} from 'lucide-react'
import {
  calcPrayerSlots, findActiveSlot,
  toHijri, toBnNum, formatTimeBn, countdownText,
} from '@/lib/prayer-times'
import type { PrayerSlot } from '@/lib/prayer-times'
import { getHijriToday, type HijriDisplayDate } from '@/lib/hijri'
import type { NamazTimeListItem } from '@/types'
import { cn } from '@/lib/utils'

function prayerIcon(key: string, active: boolean, forbidden: boolean) {
  const cls = cn('w-5 h-5', active ? 'text-white' : forbidden ? 'text-red-400' : 'text-primary')
  switch (key) {
    case 'tahajjud': case 'isha': return <Moon className={cls} />
    case 'fajr': case 'sunrise': return <Sunrise className={cls} />
    case 'ishraq': case 'midday': case 'dhuhr': case 'asr': return <Sun className={cls} />
    case 'sunset': case 'maghrib': return <Sunset className={cls} />
    default: return <Clock className={cls} />
  }
}

interface Props {
  namazTimes: NamazTimeListItem[]
}

export function NamazTimesClient({ namazTimes }: Props) {
  const [slots, setSlots] = useState<PrayerSlot[] | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(new Date())
  const [location, setLocation] = useState<string>('ঢাকা')
  const [loadingGeo, setLoadingGeo] = useState(true)
  const [hijriState, setHijriState] = useState<HijriDisplayDate | null>(null)

  // Map English title → NamazTime entry
  const namazMap = Object.fromEntries(
    namazTimes.map(n => [n.title.toLowerCase(), n])
  )

  function getDetailId(slot: PrayerSlot): string | null {
    const allKeys = [slot.titleKey, ...(slot.aliases ?? [])]
    for (const key of allKeys) {
      const exact = namazMap[key.toLowerCase()]
      if (exact) return exact.id
    }
    const partial = namazTimes.find(n =>
      allKeys.some(k =>
        n.title.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(n.title.toLowerCase())
      )
    )
    return partial?.id ?? null
  }

  const hijriReq = useRef(0)

  const recalc = useCallback((lat: number, lng: number, d = new Date(), country?: string) => {
    const s = calcPrayerSlots(lat, lng, d)
    setSlots(s)
    setNow(d)
    setActiveKey(findActiveSlot(s, d))
    // Sighting-aware date from the API; the local tabular date renders meanwhile.
    // The request counter stops a slow default-location response from
    // overwriting a later geolocated one.
    const req = ++hijriReq.current
    getHijriToday(lat, lng, country).then(h => {
      if (hijriReq.current === req) setHijriState(h)
    })
  }, [])

  useEffect(() => {
    // Render the Dhaka default immediately — geolocation refines it if/when granted.
    const dhaka = { lat: 23.8103, lng: 90.4125 }
    recalc(dhaka.lat, dhaka.lng, new Date(), 'BD')
    if (!navigator.geolocation) {
      setLoadingGeo(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        recalc(pos.coords.latitude, pos.coords.longitude)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then(r => r.json())
          .then(d => {
            const city = d.address?.city || d.address?.town || d.address?.county || ''
            if (city) setLocation(city)
          })
          .catch(() => {})
        setLoadingGeo(false)
      },
      () => {
        setLoadingGeo(false)
      },
      { timeout: 6000 }
    )
  }, [recalc])

  // Tick every minute
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setNow(n)
      if (slots) setActiveKey(findActiveSlot(slots, n))
    }, 60000)
    return () => clearInterval(id)
  }, [slots])

  const hijri = hijriState ?? { ...toHijri(now), source: 'local' as const }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground mb-4">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-lg font-bold tracking-wide">
            {toBnNum(hijri.day)} {hijri.monthBn}, {toBnNum(hijri.year)} হিজরি
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {loadingGeo
              ? <Loader2 className="w-3.5 h-3.5 animate-spin opacity-70" />
              : <MapPin className="w-3.5 h-3.5 opacity-70" />}
            <span className="text-sm opacity-80">{location}</span>
          </div>
        </div>
      </div>

      {/* ── Prayer slots ──────────────────────────────────────────────── */}
      {!slots ? (
        <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">নামাযের সময় গণনা হচ্ছে...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map(slot => {
            const isActive = activeKey === slot.key
            const detailId = getDetailId(slot)
            const isSinglePoint = slot.start.getTime() === slot.end.getTime()

            const inner = (
              <div className={cn(
                'group flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all',
                isActive
                  ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-[1.01]'
                  : slot.isForbidden
                  ? 'bg-card border-border/60 opacity-75'
                  : 'bg-card border-border hover:border-primary/40 hover:bg-primary/3'
              )}>
                {/* Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  isActive ? 'bg-white/15' : slot.isForbidden ? 'bg-red-50 dark:bg-red-950/30' : 'bg-primary/10'
                )}>
                  {prayerIcon(slot.key, isActive, slot.isForbidden)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-semibold text-[15px] leading-snug',
                      isActive ? 'text-white' : 'text-foreground'
                    )}>
                      {slot.nameBn}
                    </span>
                    {slot.isForbidden && !isActive && (
                      <TriangleAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                  </div>
                  {isActive && (
                    <p className="text-xs text-white/70 mt-0.5">{countdownText(slot.end, now)}</p>
                  )}
                </div>

                {/* Time */}
                <div className="text-right shrink-0">
                  <p className={cn(
                    'font-bold tabular-nums text-[15px]',
                    isActive ? 'text-white' : 'text-foreground'
                  )}>
                    {formatTimeBn(slot.start)}
                  </p>
                  {!isSinglePoint && (
                    <p className={cn(
                      'text-xs tabular-nums',
                      isActive ? 'text-white/65' : 'text-muted-foreground'
                    )}>
                      শেষ {formatTimeBn(slot.end)}
                    </p>
                  )}
                </div>

                {/* Arrow — only if linkable */}
                {detailId && (
                  <ChevronRight className={cn(
                    'w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5',
                    isActive ? 'text-white/70' : 'text-muted-foreground'
                  )} />
                )}
              </div>
            )

            return detailId ? (
              <Link key={slot.key} href={`/namaz-times/${detailId}`}>
                {inner}
              </Link>
            ) : (
              <div key={slot.key}>{inner}</div>
            )
          })}
        </div>
      )}

    </div>
  )
}
