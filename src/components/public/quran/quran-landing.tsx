'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, AlignLeft, ArrowRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MushafEdition, QuranSurah } from '@/types'

type Mode = 'mushaf' | 'text'

export function QuranLanding({ editions, surahs }: { editions: MushafEdition[]; surahs: QuranSurah[] }) {
  const [mode, setMode] = useState<Mode>('mushaf')
  const [search, setSearch] = useState('')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Hero ── */}
      <div className="text-center mb-10">
        <p className="text-3xl text-muted-foreground mb-2" style={{ fontFamily: 'serif' }}>
          القرآن الكريم
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mt-1">কুরআন মাজীদ</h1>
        <p className="text-muted-foreground mt-3 text-base">পবিত্র কুরআন পড়ুন — মুসহাফ বা পাঠ্য আকারে</p>
      </div>

      {/* ── Mode selector ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto mb-12">
        <ModeCard
          active={mode === 'mushaf'}
          onClick={() => setMode('mushaf')}
          icon={BookOpen}
          label="মুসহাফ"
          sub="ছবিতে পড়ুন"
        />
        <ModeCard
          active={mode === 'text'}
          onClick={() => setMode('text')}
          icon={AlignLeft}
          label="পাঠ্য কুরআন"
          sub="সূরা ও আয়াত"
          disabled={surahs.length === 0}
        />
      </div>

      {/* ── Content ── */}
      {mode === 'mushaf' && <MushafSection editions={editions} />}
      {mode === 'text'   && <TextSection surahs={surahs} search={search} onSearch={setSearch} />}
    </div>
  )
}

// ─── Mode card ────────────────────────────────────────────────────────────────

function ModeCard({
  active, onClick, icon: Icon, label, sub, disabled,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  sub: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all duration-200 text-center',
        active
          ? 'border-primary bg-primary/8 shadow-sm'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card'
      )}
    >
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={cn('font-bold text-[15px]', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </button>
  )
}

// ─── Mushaf section ───────────────────────────────────────────────────────────

function MushafSection({ editions }: { editions: MushafEdition[] }) {
  if (!editions.length) {
    return (
      <p className="text-center text-muted-foreground py-20">মুসহাফ লোড হচ্ছে না। পরে আবার চেষ্টা করুন।</p>
    )
  }

  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
        মুসহাফ বেছে নিন
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
        {editions.map(e => <EditionCard key={e.id} edition={e} />)}
      </div>
    </div>
  )
}

function EditionCard({ edition }: { edition: MushafEdition }) {
  const coverUrl = `${edition.pagesBaseUrl}/qm1.${edition.ext}`

  return (
    <Link
      href={`/quran/mushaf/${edition.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative w-full bg-muted overflow-hidden" style={{ aspectRatio: '1 / 1.5' }}>
        <Image
          src={coverUrl}
          alt={edition.title}
          fill
          className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, 33vw"
        />
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
          {edition.totalPages} পৃষ্ঠা
        </div>
      </div>
      <div className="p-3.5 flex items-start justify-between gap-2">
        <p className="text-[14px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {edition.title}
        </p>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
      </div>
    </Link>
  )
}

// ─── Text / Surah list section ────────────────────────────────────────────────

const REVELATION_LABEL: Record<string, string> = {
  Meccan: 'মক্কী',
  Medinan: 'মাদানী',
}

function TextSection({ surahs, search, onSearch }: {
  surahs: QuranSurah[]
  search: string
  onSearch: (v: string) => void
}) {
  const filtered = search.trim()
    ? surahs.filter(s =>
        s.nameBengali.includes(search) ||
        s.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
        s.transliteration.toLowerCase().includes(search.toLowerCase()) ||
        String(s.number).includes(search)
      )
    : surahs

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="সূরা খুঁজুন..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Surah grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map(surah => (
          <Link
            key={surah.number}
            href={`/quran/surah/${surah.number}`}
            className="group flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            {/* Number badge */}
            <div className="w-9 h-9 shrink-0 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors tabular-nums">
              {surah.number}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-semibold text-foreground truncate">{surah.nameBengali}</p>
                <p className="text-base text-muted-foreground shrink-0" style={{ fontFamily: 'serif', direction: 'rtl' }}>
                  {surah.nameArabic}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {surah.totalAyahs} আয়াত · {REVELATION_LABEL[surah.revelationType] ?? surah.revelationType} · পারা {surah.paraNumber}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-16">কোনো সূরা পাওয়া যায়নি।</p>
      )}
    </div>
  )
}
