'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  MapPin, Moon, Sunrise, Sun, Sunset,
  Clock, TriangleAlert, ChevronRight, Loader2,
} from 'lucide-react'
import {
  calcPrayerSlots, findActiveSlot,
  toHijri, toBanglaDate, formatNum, formatTime, countdownParts,
} from '@/lib/prayer-times'
import type { PrayerSlot } from '@/lib/prayer-times'
import { getHijriToday, type HijriDisplayDate } from '@/lib/hijri'
import type { NamazTimeListItem, NamazTimeDetail } from '@/types'
import { cn } from '@/lib/utils'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

const DESKTOP_QUERY = '(min-width: 1024px)'
function subscribeDesktopQuery(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}
const getDesktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches
const getDesktopServerSnapshot = () => false

/** True on viewports with the 2-pane layout. False during SSR/hydration to avoid a mismatch. */
function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktopQuery, getDesktopSnapshot, getDesktopServerSnapshot)
}

async function fetchNamazTimeDetail(id: string): Promise<NamazTimeDetail | null> {
  try {
    const res = await fetch(`${BASE}/api/namaz-times/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

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
  const t = useTranslations('NamazTimesPage')
  const tDetail = useTranslations('NamazTimesDetail')
  const tHome = useTranslations('Home')
  const locale = useLocale()
  const isDesktop = useIsDesktop()
  const days = tHome.raw('days') as string[]
  const months = tHome.raw('months') as string[]
  const seasons = tHome.raw('seasons') as string[]

  const [slots, setSlots] = useState<PrayerSlot[] | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(new Date())
  const [location, setLocation] = useState<string>(t('defaultLocation'))
  const [loadingGeo, setLoadingGeo] = useState(true)
  const [hijriState, setHijriState] = useState<HijriDisplayDate | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fetchedDetail, setFetchedDetail] = useState<{ id: string; data: NamazTimeDetail | null } | null>(null)

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
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=${locale}`)
          .then(r => r.json())
          .then(d => {
            const city = d.address?.city || d.address?.town || d.address?.county || d.address?.state
            const name = [city, d.address?.country].filter(Boolean).join(', ')
            if (name) setLocation(name)
          })
          .catch(() => {})
        setLoadingGeo(false)
      },
      () => {
        setLoadingGeo(false)
      },
      { timeout: 6000 }
    )
  }, [recalc, locale])

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
  const bangla = toBanglaDate(now)
  const season = seasons[bangla.monthIdx] ?? ''

  // Nothing explicitly selected yet → default to the active slot's masail on desktop
  // (falling back to the first linkable slot), where there's a detail panel to fill.
  const activeSlot = slots?.find(s => s.key === activeKey) ?? null
  const firstLinkableId = slots?.map(getDetailId).find(Boolean) ?? null
  const defaultId = (activeSlot && getDetailId(activeSlot)) ?? firstLinkableId
  const effectiveSelectedId = selectedId ?? (isDesktop ? defaultId : null)
  const detail = fetchedDetail && fetchedDetail.id === effectiveSelectedId ? fetchedDetail.data : null
  const detailLoading = effectiveSelectedId !== null && fetchedDetail?.id !== effectiveSelectedId

  // Load the detail for whichever row is selected (desktop panel only)
  useEffect(() => {
    if (!effectiveSelectedId) return
    let cancelled = false
    fetchNamazTimeDetail(effectiveSelectedId).then(d => {
      if (cancelled) return
      setFetchedDetail({ id: effectiveSelectedId, data: d })
    })
    return () => { cancelled = true }
  }, [effectiveSelectedId])

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:flex-1 lg:min-h-0">

      {/* ── List column ─────────────────────────────────────────────────── */}
      <div className="w-full lg:max-w-2xl lg:shrink-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground mb-4">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-bold tracking-wide mb-1">
                {formatNum(hijri.day, locale)} {locale === 'bn' ? hijri.monthBn : hijri.monthEn}, {formatNum(hijri.year, locale)} {t('hijri')}
              </p>
              <p className="text-base text-white/85 font-semibold">
                {days[now.getDay()]}, {formatNum(now.getDate(), locale)} {months[now.getMonth()]} {formatNum(now.getFullYear(), locale)}
              </p>
              <p className="text-base text-white/70">
                {formatNum(bangla.day, locale)} {locale === 'bn' ? bangla.monthBn : bangla.monthEn}, {formatNum(bangla.year, locale)} — {season}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-1">
              {loadingGeo
                ? <Loader2 className="w-3.5 h-3.5 animate-spin opacity-70" />
                : <MapPin className="w-3.5 h-3.5 opacity-70" />}
              <span className="text-base opacity-80">{location}</span>
            </div>
          </div>
        </div>

        {/* ── Prayer slots ──────────────────────────────────────────────── */}
        {!slots ? (
          <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-base">{t('calculating')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map(slot => {
              const isActive = activeKey === slot.key
              const detailId = getDetailId(slot)
              const isSinglePoint = slot.start.getTime() === slot.end.getTime()
              const isSelected = isDesktop && !!detailId && effectiveSelectedId === detailId

              const inner = (
                <div className={cn(
                  'group flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all',
                  isActive
                    ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-[1.01]'
                    : slot.isForbidden
                    ? 'bg-card border-border/60 opacity-75'
                    : isSelected
                    ? 'bg-card border-primary/50'
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
                        'font-semibold text-[17px] leading-snug',
                        isActive ? 'text-white' : 'text-foreground'
                      )}>
                        {locale === 'bn' ? slot.nameBn : slot.nameEn}
                      </span>
                      {slot.isForbidden && !isActive && (
                        <TriangleAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                    </div>
                    {isActive && (() => {
                      const { hours, minutes } = countdownParts(slot.end, now)
                      return (
                        <p className="text-sm text-white/70 mt-0.5">
                          {hours > 0
                            ? t('countdownHM', { hours: formatNum(hours, locale), minutes: formatNum(minutes, locale) })
                            : t('countdownM', { minutes: formatNum(minutes, locale) })}
                        </p>
                      )
                    })()}
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <p className={cn(
                      'font-bold tabular-nums text-[17px]',
                      isActive ? 'text-white' : 'text-foreground'
                    )}>
                      {formatTime(slot.start, locale)}
                    </p>
                    {!isSinglePoint && (
                      <p className={cn(
                        'text-sm tabular-nums',
                        isActive ? 'text-white/65' : 'text-muted-foreground'
                      )}>
                        {t('endsAt')} {formatTime(slot.end, locale)}
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
                <Link
                  key={slot.key}
                  href={`/namaz-times/${detailId}`}
                  onClick={e => {
                    // Desktop has a detail pane right there — fill it in instead of navigating away.
                    if (isDesktop) { e.preventDefault(); setSelectedId(detailId) }
                  }}
                >
                  {inner}
                </Link>
              ) : (
                <div key={slot.key}>{inner}</div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Detail column (desktop only) ───────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-1 lg:min-w-0 lg:min-h-0">
        <div className="flex flex-col w-full lg:min-h-0 rounded-2xl border border-border bg-card overflow-hidden">
          {!effectiveSelectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Clock className="w-14 h-14 text-muted-foreground/25 mb-4" />
              <p className="text-lg text-muted-foreground">{t('selectPrompt')}</p>
            </div>
          ) : detailLoading || !detail ? (
            <div className="p-6 sm:p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </div>
            </div>
          ) : (
            <>
              <div className="shrink-0 p-6 sm:p-8 pb-4 border-b border-border/60">
                <h2 className="text-3xl font-bold text-foreground">
                  {detail.titleBn ?? detail.title}
                </h2>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8">
                {/* Masail */}
                <div className="mb-4">
                  <p className="text-base font-bold uppercase tracking-wider text-primary mb-3">{tDetail('masail')}</p>
                  <div
                    className="prose-content text-lg leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: detail.masail }}
                  />
                </div>

                {/* Fazail */}
                {detail.fazail && (
                  <div className="pt-4 border-t border-border/60">
                    <p className="text-base font-bold uppercase tracking-wider text-primary mb-3">{tDetail('fazail')}</p>
                    <div
                      className="prose-content text-lg leading-relaxed text-foreground"
                      dangerouslySetInnerHTML={{ __html: detail.fazail }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
