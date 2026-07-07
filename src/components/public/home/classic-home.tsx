'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Mic, ScrollText, Newspaper, Loader2, Calendar, MapPin } from 'lucide-react'
import {
  calcPrayerSlots, findActiveSlot, findNextSlot,
  toHijri, toBanglaDate, toBnNum, formatTimeBn,
} from '@/lib/prayer-times'
import type { PrayerSlot } from '@/lib/prayer-times'
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

const SECTIONS = [
  { label: 'কুরআন',        href: '/quran',       icon: '/icons/quran.svg'      },
  { label: 'কিতাব',        href: '/books',       icon: '/icons/book.svg'       },
  { label: 'বয়ান',         href: '/bayan',       icon: '/icons/bayan.svg'      },
  { label: 'মালফুযাত',    href: '/malfuzat',    icon: '/icons/malfuzat.svg'   },
  { label: 'মাসাইল',      href: '/masail',      icon: '/icons/masail.svg'     },
  { label: "দু'আ-দুরূদ",  href: '/dua',         icon: '/icons/dua.svg'        },
  { label: 'প্রবন্ধ',     href: '/articles',    icon: '/icons/article.svg'    },
  { label: 'সংবাদ',       href: '/news',        icon: '/icons/news.svg'       },
  { label: 'মাদরাসা',     href: '/madrasah',    icon: '/icons/madrasah.svg'   },
  { label: 'নামাযের সময়', href: '/namaz-times', icon: '/icons/namaz-time.svg' },
  { label: 'অনুদান',      href: '/donate',      icon: '/icons/donate.svg'     },
  { label: 'সেটিংস',      href: '/settings',    icon: '/icons/settings.svg'   },
]

const BN_DAYS   = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার']
const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর']
const BN_SEASONS = ['গ্রীষ্মকাল','গ্রীষ্মকাল','বর্ষাকাল','বর্ষাকাল','শরৎকাল','শরৎকাল','হেমন্তকাল','হেমন্তকাল','শীতকাল','শীতকাল','বসন্তকাল','বসন্তকাল']

// ── Prayer card ───────────────────────────────────────────────────────────────

function PrayerCard({ width }: { width: number | null }) {
  const style = width ? { width } : undefined

  const [state, setState] = useState<{
    slots: PrayerSlot[]
    activeKey: string | null
    now: Date
    locationName: string
  } | null>(null)

  const init = useCallback((lat: number, lng: number, locationName: string) => {
    const now = new Date()
    const slots = calcPrayerSlots(lat, lng, now)
    setState({ slots, activeKey: findActiveSlot(slots, now), now, locationName })
  }, [])

  useEffect(() => {
    const dk = [23.8103, 90.4125] as const
    if (!navigator.geolocation) { init(...dk, 'ঢাকা, বাংলাদেশ'); return }
    navigator.geolocation.getCurrentPosition(
      p => init(p.coords.latitude, p.coords.longitude, 'আপনার অবস্থান'),
      () => init(...dk, 'ঢাকা, বাংলাদেশ'),
      { timeout: 5000 }
    )
  }, [init])

  useEffect(() => {
    if (!state) return
    const id = setInterval(() => {
      const now = new Date()
      setState(s => s ? { ...s, now, activeKey: findActiveSlot(s.slots, now) } : s)
    }, 60000)
    return () => clearInterval(id)
  }, [state?.slots]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return (
    <div className="mx-auto rounded-2xl bg-card dark:bg-[#163f4f] border border-foreground/15 shadow-sm px-5 py-4 flex items-center gap-3 text-muted-foreground shrink-0" style={style}>
      <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
      <span className="text-sm">লোড হচ্ছে...</span>
    </div>
  )

  const { slots, activeKey, now, locationName } = state
  const hijri  = toHijri(now)
  const bangla = toBanglaDate(now)
  const active = slots.find(s => s.key === activeKey)
  const next   = findNextSlot(slots, now)
  const season = BN_SEASONS[bangla.monthIdx] ?? ''

  return (
    <Link href="/namaz-times" className="mx-auto block rounded-2xl bg-card dark:bg-[#163f4f] border border-foreground/15 shadow-sm hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all p-4 shrink-0" style={style}>
      {/* Dates */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-foreground leading-snug">
            {toBnNum(hijri.day)} {hijri.monthBn}, {toBnNum(hijri.year)} হিজরী
          </p>
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-base text-foreground/65">
            {BN_DAYS[now.getDay()]}, {toBnNum(now.getDate())} {BN_MONTHS[now.getMonth()]} {toBnNum(now.getFullYear())}
          </p>
          <Calendar className="w-3 h-3 text-muted-foreground/50 shrink-0" />
        </div>
        <p className="text-base text-foreground/65">
          {toBnNum(bangla.day)} {bangla.monthBn}, {toBnNum(bangla.year)} — {season}
        </p>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <p className="text-sm text-foreground/60">{locationName}</p>
        </div>
      </div>

      {/* Prayer times */}
      <div className="rounded-xl bg-muted/40 border border-border/30 px-3.5 py-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-0.5">চলমান</p>
          {active ? (
            <>
              <p className="text-lg font-bold text-primary leading-tight">{active.nameBn}</p>
              <p className="text-sm text-foreground/70 mt-1.5">শুরু {formatTimeBn(active.start)}</p>
              <p className="text-sm text-foreground/70 mt-0.5">শেষ {formatTimeBn(active.end)}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
        {next && (
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-0.5">পরবর্তী</p>
            <p className="text-lg font-bold text-foreground/80 leading-tight">{next.nameBn}</p>
            <p className="text-sm text-foreground/70 mt-1.5">শুরু {formatTimeBn(next.start)}</p>
          </div>
        )}
      </div>
    </Link>
  )
}

// ── News card ─────────────────────────────────────────────────────────────────

function NewsCard({ news, width }: { news: NewsListItem[]; width: number | null }) {
  if (news.length === 0) return null
  const latest = news[0]

  return (
    <div
      className="mx-auto shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/12 to-primary/5 border border-primary/25 shadow-sm hover:shadow-md transition-all"
      style={width ? { width } : undefined}
    >
      <Link href={`/news/${latest.id}`} className="group flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Newspaper className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">সর্বশেষ সংবাদ</p>
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{latest.title}</p>
        </div>
      </Link>
      <Link href="/news" className="text-xs text-primary font-medium hover:underline whitespace-nowrap shrink-0">
        সব দেখুন →
      </Link>
    </div>
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
            {b.coverUrl
              ? <Image src={b.coverUrl} alt={b.title} fill className="object-cover" sizes="96px" />
              : <div className="w-full h-full bg-primary/8 flex items-center justify-center"><BookOpen className="w-6 h-6 text-primary/30" /></div>
            }
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0 py-1">
            <p className="font-semibold text-primary leading-snug line-clamp-2">{b.title}</p>
            {b.authors[0] && <p className="text-sm text-foreground/70 mt-1">{b.authors[0].name}</p>}
            {b.excerpt && <p className="text-sm text-foreground/60 mt-1.5 line-clamp-2 leading-relaxed">{b.excerpt}</p>}
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
            <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
            {item.subtitle && <p className="text-xs text-foreground/60 truncate">{item.subtitle}</p>}
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

const TABS: { key: Tab; label: string; href: string }[] = [
  { key: 'books',    label: 'নতুন কিতাব',    href: '/books'    },
  { key: 'bayans',   label: 'নতুন বয়ান',     href: '/bayan'    },
  { key: 'malfuzat', label: 'নতুন মালফুযাত', href: '/malfuzat' },
  { key: 'articles', label: 'নতুন প্রবন্ধ',  href: '/articles' },
]

export function ClassicHome({
  books, booksTotal, bayans, bayansTotal, malfuzat, malfuzatTotal,
  articles, articlesTotal, news,
}: Props) {
  const [tab, setTab] = useState<Tab>('books')

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

  // Size the prayer/news cards to match the icon row exactly (first icon's left
  // edge to the third icon's right edge) — the icons sit centered inside wider,
  // equal-width grid cells, so this can't be expressed as a fixed CSS width.
  // Re-measured via ResizeObserver on the nav itself (not just window resize),
  // since the nav's width — and therefore the icons' positions — can also shift
  // from layout causes that aren't a viewport resize (e.g. a scrollbar appearing
  // once the prayer card finishes loading and grows taller).
  const navRef = useRef<HTMLElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  const [cardWidth, setCardWidth] = useState<number | null>(null)

  useEffect(() => {
    function measure() {
      const first = iconRefs.current[0]
      const third = iconRefs.current[2]
      if (!first || !third) return
      setCardWidth(Math.round(third.getBoundingClientRect().right - first.getBoundingClientRect().left))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (navRef.current) ro.observe(navRef.current)
    return () => ro.disconnect()
  }, [])

  const currentTabHref = TABS.find(t => t.key === tab)?.href ?? '/'

  const bayansForList   = bayansList.items.map(b   => ({ id: b.id, title: b.title, subtitle: b.author?.name }))
  const malfuzatForList = malfuzatList.items.map(m => ({ id: m.id, title: m.title, subtitle: m.author?.name }))
  const articlesForList = articlesList.items.map(a => ({ id: a.id, title: a.title, subtitle: a.author?.name ?? null }))

  return (
    <div className="flex flex-col bg-background lg:h-[calc(100vh-68px)] lg:overflow-hidden">

      {/* ── Main row: stacked on mobile, side-by-side on desktop ─── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:gap-4 lg:p-4">

        {/* ── LEFT: full-width on mobile, 50% on desktop ─────────── */}
        <div className="w-full lg:w-[50%] lg:shrink-0 flex flex-col border-b lg:border-b-0 lg:border lg:rounded-2xl border-border/40 p-4 gap-3 lg:overflow-hidden">
          <PrayerCard width={cardWidth} />

          <nav ref={navRef} className="flex-1 min-h-0 grid grid-cols-3 auto-rows-fr gap-1.5 mb-3">
            {SECTIONS.map(({ label, href, icon }, i) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center justify-center gap-1.5 lg:gap-3 px-1 rounded-2xl hover:bg-primary/10 transition-colors text-center"
              >
                <div
                  ref={el => { iconRefs.current[i] = el }}
                  className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl bg-card dark:bg-[#fdfdfd] border border-foreground/20 dark:border-black/10 shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:border-primary/60 transition-all p-2.5 sm:p-3 lg:p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt={label} className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] sm:text-xs lg:text-base font-semibold text-foreground leading-tight">{label}</span>
              </Link>
            ))}
          </nav>

          <NewsCard news={news} width={cardWidth} />
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
                    'px-2.5 lg:px-3 py-1.5 rounded-lg text-[12px] lg:text-[13px] font-medium transition-all whitespace-nowrap',
                    tab === key
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-foreground/55 hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={currentTabHref} className="text-xs text-primary font-medium hover:underline whitespace-nowrap">সব দেখুন →</Link>
              <span className="text-border/60 text-xs hidden sm:block">|</span>
              <Link href="/explore" className="text-xs text-foreground/60 hover:text-primary transition-colors hidden sm:block whitespace-nowrap">নতুন লেআউট →</Link>
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
