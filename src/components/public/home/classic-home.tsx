'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Mic, ScrollText, Newspaper, Loader2, Calendar, MapPin } from 'lucide-react'
import {
  calcPrayerSlots, findActiveSlot, findNextSlot,
  toHijri, toBanglaDate, formatNum, formatTime,
} from '@/lib/prayer-times'
import type { PrayerSlot } from '@/lib/prayer-times'
import { getHijriToday, type HijriDisplayDate } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import type { Book, BayanListItem, MalfuzatListItem, ArticleListItem, NewsListItem, PagedResult } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const HOME_PAGE_SIZE = 8

async function fetchNextPage<T>(path: string, page: number, extra: Record<string, string> = {}): Promise<{ data: T[]; total: number }> {
  const q = new URLSearchParams({ published: 'true', page: String(page), pageSize: String(HOME_PAGE_SIZE), ...extra })
  try {
    const res = await fetch(`${API_BASE}${path}?${q}`)
    if (!res.ok) return { data: [], total: 0 }
    const r: PagedResult<T> = await res.json()
    return { data: r.data, total: r.total }
  } catch { return { data: [], total: 0 } }
}

// Loads page 1 upfront (from the server), then fetches subsequent pages as the
// user scrolls the tab panel — one instance per home-page tab.
function useInfiniteList<T>(initialItems: T[], initialTotal: number, path: string, extra?: Record<string, string>) {
  const [items, setItems] = useState(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)

  const hasMore = items.length < total

  const loadMore = useCallback(async () => {
    if (loadingRef.current || items.length >= total) return
    loadingRef.current = true
    setLoading(true)
    const nextPage = page + 1
    const res = await fetchNextPage<T>(path, nextPage, extra)
    setItems(prev => [...prev, ...res.data])
    setTotal(res.total)
    setPage(nextPage)
    setLoading(false)
    loadingRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, items.length, total, path])

  return { items, hasMore, loading, loadMore }
}

// ── Prayer card ───────────────────────────────────────────────────────────────

function PrayerCard() {
  const t = useTranslations('Home')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const days = t.raw('days') as string[]
  const months = t.raw('months') as string[]
  const seasons = t.raw('seasons') as string[]

  const [state, setState] = useState<{
    slots: PrayerSlot[]
    activeKey: string | null
    now: Date
    locationName: string
    hijri: HijriDisplayDate | null
  } | null>(null)

  const hijriReq = useRef(0)

  const init = useCallback((lat: number, lng: number, locationName: string, country?: string) => {
    const now = new Date()
    const slots = calcPrayerSlots(lat, lng, now)
    setState({ slots, activeKey: findActiveSlot(slots, now), now, locationName, hijri: null })
    const req = ++hijriReq.current
    getHijriToday(lat, lng, country).then(hijri =>
      setState(s => s && hijriReq.current === req ? { ...s, hijri } : s))
  }, [])

  useEffect(() => {
    // Render the Dhaka default immediately — geolocation refines it if/when granted.
    const dk = [23.8103, 90.4125] as const
    init(...dk, t('dhakaLocation'), 'BD')
    if (!navigator.geolocation) return
    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      p => {
        const { latitude, longitude } = p.coords
        init(latitude, longitude, t('yourLocation'))
        // Refine the placeholder label to "City, Country" once reverse geocoding resolves.
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${locale}`)
          .then(r => r.json())
          .then(d => {
            if (cancelled) return
            const city = d.address?.city || d.address?.town || d.address?.county || d.address?.state
            const name = [city, d.address?.country].filter(Boolean).join(', ')
            if (name) setState(s => s ? { ...s, locationName: name } : s)
          })
          .catch(() => {})
      },
      () => { /* keep the Dhaka default */ },
      { timeout: 5000 }
    )
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init, locale])

  useEffect(() => {
    if (!state) return
    const id = setInterval(() => {
      const now = new Date()
      setState(s => s ? { ...s, now, activeKey: findActiveSlot(s.slots, now) } : s)
    }, 60000)
    return () => clearInterval(id)
  }, [state?.slots]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return (
    <div className="rounded-2xl bg-card dark:bg-[#163f4f] border border-foreground/15 shadow-sm px-5 py-4 flex items-center gap-3 text-muted-foreground shrink-0 w-full">
      <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
      <span className="text-sm">{tCommon('loading')}</span>
    </div>
  )

  const { slots, activeKey, now, locationName } = state
  const hijri  = state.hijri ?? { ...toHijri(now), source: 'local' as const }
  const bangla = toBanglaDate(now)
  const active = slots.find(s => s.key === activeKey)
  const next   = findNextSlot(slots, now)
  const season = seasons[bangla.monthIdx] ?? ''

  const iconBtn = 'inline-flex items-center justify-center rounded-lg border border-foreground/25 text-foreground/60 group-hover:border-primary/60 group-hover:text-primary transition-colors shrink-0'

  return (
    <div className="shrink-0 w-full flex flex-col gap-3 lg:gap-4">
      {/* Dates: plain left-aligned masthead, no card (matches the app) */}
      <Link href="/namaz-times" className="group block px-1">
        <h2 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-bold text-primary dark:text-white leading-snug">
          <span>{formatNum(hijri.day, locale)} {locale === 'bn' ? hijri.monthBn : hijri.monthEn}, {formatNum(hijri.year, locale)} {t('hijriSuffix')}</span>
          <span className={cn(iconBtn, 'w-8 h-8')}><Calendar className="w-4 h-4" /></span>
        </h2>
        <p className="mt-1.5 flex items-center gap-2.5 text-base sm:text-lg text-foreground/80 dark:text-white/80 font-semibold">
          <span>{days[now.getDay()]}, {formatNum(now.getDate(), locale)} {months[now.getMonth()]}, {formatNum(now.getFullYear(), locale)}</span>
          <span className={cn(iconBtn, 'w-7 h-7')}><Calendar className="w-3.5 h-3.5" /></span>
        </p>
        <p className="mt-1 text-base sm:text-lg text-foreground/70 dark:text-white/70">
          {formatNum(bangla.day, locale)} {locale === 'bn' ? bangla.monthBn : bangla.monthEn}, {formatNum(bangla.year, locale)} {season}
        </p>
        <p className="mt-1.5 flex items-center gap-2.5 text-base sm:text-lg text-foreground/70 dark:text-white/70">
          <span>{locationName}</span>
          <span className={cn(iconBtn, 'w-7 h-7')}><MapPin className="w-3.5 h-3.5" /></span>
        </p>
      </Link>

      {/* Prayer times: one full-width card, current | next columns (matches the app) */}
      <Link href="/namaz-times" className="group rounded-2xl bg-card dark:bg-[#163f4f] border border-border/60 dark:border-foreground/15 shadow-sm hover:border-primary/50 hover:shadow-md transition-all p-4 lg:p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base lg:text-lg font-bold text-primary dark:text-amber-300">{t('current')}</p>
          {active ? (
            <>
              <div className="mt-1 flex items-center gap-x-4 gap-y-0.5 flex-wrap">
                <span className="text-xl lg:text-2xl font-bold text-foreground dark:text-white leading-snug">{locale === 'bn' ? active.nameBn : active.nameEn}</span>
                <span className="text-sm lg:text-base text-foreground/70 dark:text-white/70">
                  {t('start')} <span className="text-2xl lg:text-3xl font-extrabold text-foreground dark:text-white tracking-tight">{formatTime(active.start, locale)}</span>
                </span>
              </div>
              <p className="mt-0.5 text-sm lg:text-base text-foreground/70 dark:text-white/70">
                {t('end')} <span className="text-2xl lg:text-3xl font-extrabold text-foreground dark:text-white tracking-tight">{formatTime(active.end, locale)}</span>
              </p>
            </>
          ) : (
            <p className="mt-1 text-base text-muted-foreground">—</p>
          )}
        </div>
        {next && (
          <div className="text-right shrink-0">
            <p className="text-base lg:text-lg font-bold text-primary dark:text-amber-300">{t('next')}</p>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-foreground dark:text-white leading-snug">{locale === 'bn' ? next.nameBn : next.nameEn}</p>
            <p className="mt-0.5 text-sm lg:text-base text-foreground/70 dark:text-white/70">
              {t('start')} <span className="text-xl lg:text-2xl font-extrabold text-foreground dark:text-white tracking-tight">{formatTime(next.start, locale)}</span>
            </p>
          </div>
        )}
      </Link>
    </div>
  )
}

// ── News card ─────────────────────────────────────────────────────────────────

function NewsCard({ news }: { news: NewsListItem[] }) {
  const t = useTranslations('Home')
  if (news.length === 0) return null
  const latest = news[0]

  return (
    <Link
      href={`/news/${latest.id}`}
      className="group shrink-0 w-full flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-3.5 rounded-2xl bg-gradient-to-r from-primary/12 to-primary/5 border border-primary/25 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
    >
      <span className="text-base lg:text-lg font-bold text-primary dark:text-amber-300 whitespace-nowrap shrink-0">{t('latestNews')}</span>
      <span className="text-base lg:text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">{latest.title}</span>
    </Link>
  )
}

// ── Tab content ───────────────────────────────────────────────────────────────

function BooksGrid({ books }: { books: Book[] }) {
  return (
    <div className="divide-y divide-border/50">
      {books.map(b => (
        <Link key={b.id} href={`/books/${b.id}`} className="group flex gap-4 py-4 first:pt-0 -mx-4 px-4 hover:bg-muted/30 transition-colors rounded-xl">
          {/* Cover */}
          <div className="relative w-20 sm:w-24 shrink-0 rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow" style={{ aspectRatio: '3/4' }}>
            <Image 
              src={b.coverUrl || '/images/default-book.png'} 
              alt={b.title} 
              fill 
              className="object-cover" 
              sizes="96px" 
            />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0 py-1">
            <p className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">{b.title}</p>
            {b.authors[0] && <p className="text-lg text-foreground/70 mt-1">{b.authors[0].name}</p>}
            {b.excerpt && <p className="text-lg text-foreground/60 mt-1.5 line-clamp-2 leading-relaxed">{b.excerpt}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

function CompactList({ items, href, icon: Icon }: {
  items: { id: string; title: string; subtitle?: string | null }[]
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-0.5">
      {items.map(item => (
        <Link key={item.id} href={`${href}/${item.id}`} className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
            {item.subtitle && <p className="text-base text-foreground/60 truncate">{item.subtitle}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  books: Book[]
  booksTotal: number
  bayans: BayanListItem[]
  bayansTotal: number
  malfuzat: MalfuzatListItem[]
  malfuzatTotal: number
  articles: ArticleListItem[]
  articlesTotal: number
  news: NewsListItem[]
}

type Tab = 'books' | 'bayans' | 'malfuzat' | 'articles'

export function ClassicHome({
  books, booksTotal, bayans, bayansTotal, malfuzat, malfuzatTotal,
  articles, articlesTotal, news,
}: Props) {
  const t = useTranslations('Home')
  const tNav = useTranslations('Nav')
  const [tab, setTab] = useState<Tab>('books')

  const SECTIONS = [
    { label: tNav('quran'),        href: '/quran',       icon: '/icons/quran.svg'      },
    { label: tNav('books'),        href: '/books',       icon: '/icons/book.svg'       },
    { label: tNav('bayan'),        href: '/bayan',       icon: '/icons/bayan.svg'      },
    { label: tNav('malfuzat'),     href: '/malfuzat',    icon: '/icons/malfuzat.svg'   },
    { label: tNav('masail'),       href: '/masail',      icon: '/icons/masail.svg'     },
    { label: tNav('dua'),         href: '/dua',         icon: '/icons/dua.svg'        },
    { label: tNav('articles'),     href: '/articles',    icon: '/icons/article.svg'    },
    { label: tNav('news'),        href: '/news',        icon: '/icons/news.svg'       },
    { label: tNav('madrasah'),     href: '/madrasah',    icon: '/icons/madrasah.svg'   },
    { label: tNav('namazTimes'),   href: '/namaz-times', icon: '/icons/namaz-time.svg' },
    { label: t('navDonate'),      href: '/donate',      icon: '/icons/donate.svg'     },
    { label: t('navSettings'),    href: '/settings',    icon: '/icons/settings.svg'   },
  ]

  const TABS: { key: Tab; label: string; href: string }[] = [
    { key: 'books',    label: t('tabBooks'),    href: '/books'    },
    { key: 'bayans',   label: t('tabBayans'),   href: '/bayan'    },
    { key: 'malfuzat', label: t('tabMalfuzat'), href: '/malfuzat' },
    { key: 'articles', label: t('tabArticles'), href: '/articles' },
  ]

  const booksList    = useInfiniteList<Book>(books, booksTotal, '/api/books')
  const bayansList   = useInfiniteList<BayanListItem>(bayans, bayansTotal, '/api/bayan', { sort: 'date' })
  const malfuzatList = useInfiniteList<MalfuzatListItem>(malfuzat, malfuzatTotal, '/api/malfuzat')
  const articlesList = useInfiniteList<ArticleListItem>(articles, articlesTotal, '/api/articles')

  const activeLoadMore =
    tab === 'books' ? booksList.loadMore :
    tab === 'bayans' ? bayansList.loadMore :
    tab === 'malfuzat' ? malfuzatList.loadMore :
    articlesList.loadMore

  const activeLoading =
    tab === 'books' ? booksList.loading :
    tab === 'bayans' ? bayansList.loading :
    tab === 'malfuzat' ? malfuzatList.loading :
    articlesList.loading

  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = containerRef.current
    const el = sentinelRef.current
    if (!root || !el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) activeLoadMore()
    }, { root, rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [tab, activeLoadMore])

  const currentTabHref = TABS.find(tab_ => tab_.key === tab)?.href ?? '/'

  const bayansForList   = bayansList.items.map(b   => ({ id: b.id, title: b.title, subtitle: b.author?.name }))
  const malfuzatForList = malfuzatList.items.map(m => ({ id: m.id, title: m.title, subtitle: m.author?.name }))
  const articlesForList = articlesList.items.map(a => ({ id: a.id, title: a.title, subtitle: a.author?.name ?? null }))

  return (
    <div className="flex flex-col bg-background h-[calc(100vh-68px)] overflow-y-auto lg:overflow-hidden">

      {/* ── Main row: stacked on mobile, side-by-side on desktop ─── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:gap-4 lg:p-4">

        {/* ── LEFT: full-width on mobile, 50% on desktop ─────────── */}
        <div className="w-full flex-1 min-h-0 lg:flex-none lg:w-[50%] lg:shrink-0 flex flex-col border-b lg:border-b-0 lg:border lg:rounded-2xl border-border/40 p-3 lg:p-4 gap-3 lg:gap-4 overflow-hidden">
          <PrayerCard />

          {/* 3×4 tile grid on a rounded sheet — label inside each tile. The grid
              absorbs all leftover height (tiles stretch, icons capped) so the
              column always fits the viewport without scrolling. */}
          <div className="flex-1 min-h-0 flex flex-col rounded-3xl bg-primary/[0.04] dark:bg-white/5 border border-border/40 p-2.5 lg:p-3">
            <nav className="flex-1 min-h-0 grid grid-cols-3 grid-rows-4 gap-2.5 lg:gap-3">
              {SECTIONS.map(({ label, href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col items-center justify-center min-h-0 gap-1.5 sm:gap-2 rounded-2xl sm:rounded-3xl bg-primary/5 dark:bg-white/10 border border-primary/25 dark:border-white/10 shadow-sm dark:shadow-none p-2 text-center hover:bg-primary/10 dark:hover:bg-white/20 hover:border-primary/60 hover:shadow-md dark:hover:shadow-none transition-all"
                >
                  <img src={icon} alt="" className="flex-1 min-h-0 w-full max-h-12 sm:max-h-16 lg:max-h-20 object-contain" />
                  <span className="shrink-0 text-sm sm:text-base lg:text-lg font-semibold text-primary dark:text-foreground leading-tight px-1">{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <NewsCard news={news} />
        </div>

        {/* ── RIGHT: hidden on mobile, shown on desktop ───────────── */}
        <div className="hidden lg:flex flex-1 min-w-0 flex-col lg:overflow-hidden lg:border lg:border-border/40 lg:rounded-2xl">

          {/* Tab bar */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 lg:px-5 pt-4 pb-3 border-b border-border/30">
            <div className="flex gap-0.5 bg-muted rounded-xl p-1 overflow-x-auto">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'px-2.5 lg:px-3 py-1.5 rounded-lg text-base lg:text-lg font-medium transition-all whitespace-nowrap',
                    tab === key
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-foreground/55 hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={currentTabHref} className="text-base text-primary font-medium hover:underline whitespace-nowrap">{t('viewAllArrow')}</Link>
              <div className="w-px h-3 bg-border/60 hidden sm:block" />
              <Link href="/explore" className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-base font-semibold hover:bg-primary/20 transition-colors hidden sm:flex whitespace-nowrap">
                {t('newLayoutLink')}
              </Link>
            </div>
          </div>

          {/* Tab content */}
          <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-5">
            {tab === 'books'    && <BooksGrid books={booksList.items} />}
            {tab === 'bayans'   && <CompactList items={bayansForList}   href="/bayan"    icon={Mic}       />}
            {tab === 'malfuzat' && <CompactList items={malfuzatForList} href="/malfuzat" icon={ScrollText} />}
            {tab === 'articles' && <CompactList items={articlesForList} href="/articles" icon={Newspaper}  />}

            <div ref={sentinelRef} />
            {activeLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
