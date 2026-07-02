'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Mic, ScrollText, Newspaper, Loader2 } from 'lucide-react'
import {
  calcPrayerSlots, findActiveSlot, findNextSlot,
  toHijri, toBanglaDate, toBnNum, formatTimeBn,
} from '@/lib/prayer-times'
import type { PrayerSlot } from '@/lib/prayer-times'
import { cn } from '@/lib/utils'
import type { Book, BayanListItem, MalfuzatListItem, ArticleListItem, NewsListItem } from '@/types'

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

// ── Prayer card ───────────────────────────────────────────────────────────────

function PrayerCard() {
  const [state, setState] = useState<{ slots: PrayerSlot[]; activeKey: string | null; now: Date } | null>(null)

  const init = useCallback((lat: number, lng: number) => {
    const now = new Date()
    const slots = calcPrayerSlots(lat, lng, now)
    setState({ slots, activeKey: findActiveSlot(slots, now), now })
  }, [])

  useEffect(() => {
    const dk = [23.8103, 90.4125] as const
    if (!navigator.geolocation) { init(...dk); return }
    navigator.geolocation.getCurrentPosition(
      p => init(p.coords.latitude, p.coords.longitude),
      () => init(...dk),
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
    <div className="rounded-2xl bg-card border border-border shadow-sm px-5 py-4 flex items-center gap-3 text-muted-foreground shrink-0">
      <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
      <span className="text-sm">লোড হচ্ছে...</span>
    </div>
  )

  const { slots, activeKey, now } = state
  const hijri  = toHijri(now)
  const bangla = toBanglaDate(now)
  const active = slots.find(s => s.key === activeKey)
  const next   = findNextSlot(slots, now)

  return (
    <Link href="/namaz-times" className="block rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all px-5 py-4 shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold text-foreground leading-snug">
            {toBnNum(hijri.day)} {hijri.monthBn}, {toBnNum(hijri.year)} হিজরি
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {toBnNum(bangla.day)} {bangla.monthBn}, {toBnNum(bangla.year)} বঙ্গাব্দ
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {BN_DAYS[now.getDay()]}, {toBnNum(now.getDate())} {BN_MONTHS[now.getMonth()]} {toBnNum(now.getFullYear())}
          </p>
        </div>
        <div className="text-right shrink-0">
          {active && (
            <>
              <p className="text-lg font-bold text-primary leading-tight">{active.nameBn}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{formatTimeBn(active.start)} – {formatTimeBn(active.end)}</p>
              {next && <p className="text-sm text-muted-foreground/70 mt-1">পরবর্তী: {next.nameBn} {formatTimeBn(next.start)}</p>}
            </>
          )}
          {!active && next && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">পরবর্তী</p>
              <p className="text-lg font-bold text-primary leading-tight">{next.nameBn}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{formatTimeBn(next.start)}</p>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Tab content ───────────────────────────────────────────────────────────────

function BooksGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
      {books.slice(0, 8).map(b => (
        <Link key={b.id} href={`/books/${b.id}`} className="group min-w-0">
          <div className="relative w-full rounded-xl overflow-hidden bg-muted mb-2 shadow-sm group-hover:shadow-md transition-shadow" style={{ aspectRatio: '3/4' }}>
            {b.coverUrl
              ? <Image src={b.coverUrl} alt={b.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" sizes="200px" />
              : <div className="w-full h-full bg-primary/8 flex items-center justify-center"><BookOpen className="w-8 h-8 text-primary/30" /></div>
            }
          </div>
          <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{b.title}</p>
          {b.authors[0] && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{b.authors[0].name}</p>}
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
            {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  books: Book[]
  bayans: BayanListItem[]
  malfuzat: MalfuzatListItem[]
  articles: ArticleListItem[]
  news: NewsListItem[]
}

type Tab = 'books' | 'bayans' | 'malfuzat' | 'articles'

const TABS: { key: Tab; label: string; href: string }[] = [
  { key: 'books',    label: 'নতুন কিতাব',    href: '/books'    },
  { key: 'bayans',   label: 'নতুন বয়ান',     href: '/bayan'    },
  { key: 'malfuzat', label: 'নতুন মালফুযাত', href: '/malfuzat' },
  { key: 'articles', label: 'নতুন প্রবন্ধ',  href: '/articles' },
]

export function ClassicHome({ books, bayans, malfuzat, articles, news }: Props) {
  const [tab, setTab] = useState<Tab>('books')


  const currentTabHref = TABS.find(t => t.key === tab)?.href ?? '/'

  const bayansForList   = bayans.map(b   => ({ id: b.id, title: b.title, subtitle: b.author?.name }))
  const malfuzatForList = malfuzat.map(m => ({ id: m.id, title: m.title, subtitle: m.author?.name }))
  const articlesForList = articles.map(a => ({ id: a.id, title: a.title, subtitle: a.author?.name ?? null }))

  return (
    <div className="flex flex-col bg-background lg:h-[calc(100vh-68px)] lg:overflow-hidden">

      {/* ── Main row: stacked on mobile, side-by-side on desktop ─── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* ── LEFT: full-width on mobile, 40% on desktop ─────────── */}
        <div className="w-full lg:w-[40%] lg:shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-border/40 p-4 gap-3 lg:overflow-hidden">
          <PrayerCard />

          <nav className="flex-1 min-h-0 grid grid-cols-4 lg:grid-cols-3 auto-rows-fr gap-1">
            {SECTIONS.map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center justify-center gap-1.5 lg:gap-3 px-1 rounded-2xl hover:bg-muted/50 transition-colors text-center"
              >
                <div className="w-14 h-14 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-2xl lg:rounded-3xl bg-card border border-border/40 shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:border-primary/30 transition-all p-3 sm:p-3.5 lg:p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt={label} className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] sm:text-xs lg:text-base font-semibold text-foreground leading-tight">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* ── RIGHT: full-width on mobile ─────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">

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
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={currentTabHref} className="text-xs text-primary font-medium hover:underline whitespace-nowrap">সব দেখুন →</Link>
              <span className="text-border/60 text-xs hidden sm:block">|</span>
              <Link href="/explore" className="text-xs text-muted-foreground hover:text-primary transition-colors hidden sm:block whitespace-nowrap">নতুন লেআউট →</Link>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-5">
            {tab === 'books'    && <BooksGrid books={books} />}
            {tab === 'bayans'   && <CompactList items={bayansForList}   href="/bayan"    icon={Mic}       />}
            {tab === 'malfuzat' && <CompactList items={malfuzatForList} href="/malfuzat" icon={ScrollText} />}
            {tab === 'articles' && <CompactList items={articlesForList} href="/articles" icon={Newspaper}  />}
          </div>
        </div>
      </div>

      {/* ── Bottom news strip ─────────────────────────────────────────── */}
      <div className="shrink-0 h-9 border-t border-border/40 bg-muted/30 flex items-center gap-3 px-4 lg:px-5">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider shrink-0 whitespace-nowrap hidden sm:block">
          সর্বশেষ সংবাদ
        </span>
        <div className="hidden sm:block w-px h-3.5 bg-border shrink-0" />
        <div className="flex-1 flex items-center gap-4 overflow-x-auto min-w-0">
          {news.map((n, i) => (
            <span key={n.id} className="flex items-center gap-4 shrink-0">
              {i > 0 && <span className="text-border/60 text-xs">·</span>}
              <Link href={`/news/${n.id}`} className="text-xs text-foreground/70 hover:text-primary transition-colors whitespace-nowrap">
                {n.title}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
