'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { BookOpen, AlignLeft, AlignJustify, ArrowRight, Search, BookMarked, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MushafEdition, QuranSurah } from '@/types'
import { QuranSearchModal } from './quran-search-modal'
import { BookmarksModal } from './bookmarks-modal'
import { getLastRead, type QuranLastRead } from '@/lib/quran-last-read'
import { DEFAULT_ARABIC_FONT } from '@/lib/quran-fonts'
import { bn } from '@/lib/bengali-numerals'

type Mode = 'mushaf' | 'text' | 'tilawat'

const MODES: Mode[] = ['mushaf', 'text', 'tilawat']

export function QuranLanding({ editions, surahs }: { editions: MushafEdition[]; surahs: QuranSurah[] }) {
  const t = useTranslations('QuranLanding')
  const locale = useLocale()
  const n = (val: number | string) => locale === 'bn' ? bn(val) : val
  const searchParams = useSearchParams()
  const initialMode = ((): Mode => {
    const m = searchParams.get('mode')
    return m && (MODES as string[]).includes(m) ? (m as Mode) : 'mushaf'
  })()
  const [mode, setModeState] = useState<Mode>(initialMode)

  // Persist the active tab in the URL so the browser Back button restores it
  // when returning from a surah/tilawat/mushaf reader.
  const setMode = (next: Mode) => {
    setModeState(next)
    const params = new URLSearchParams(window.location.search)
    if (next === 'mushaf') params.delete('mode')
    else params.set('mode', next)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
  }

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const [lastRead, setLastReadState] = useState<QuranLastRead | null>(null)

  useEffect(() => { setLastReadState(getLastRead()) }, [])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8 sm:py-10">
      {searchOpen && <QuranSearchModal onClose={() => setSearchOpen(false)} />}
      {bookmarksOpen && <BookmarksModal onClose={() => setBookmarksOpen(false)} />}

      <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
        {/* ── Sidebar (Mode selector) ── */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
          <ModeCard
            active={mode === 'mushaf'}
            onClick={() => setMode('mushaf')}
            icon={BookOpen}
            label={t('modeMushaf')}
            sub={t('modeMushafSub')}
          />
          <ModeCard
            active={mode === 'text'}
            onClick={() => setMode('text')}
            icon={AlignLeft}
            label={t('modeText')}
            sub={t('modeTextSub')}
            disabled={surahs.length === 0}
          />
          <ModeCard
            active={mode === 'tilawat'}
            onClick={() => setMode('tilawat')}
            icon={AlignJustify}
            label={t('modeTilawat')}
            sub={t('modeTilawatSub')}
            disabled={surahs.length === 0}
          />
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setBookmarksOpen(true)}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-lg text-muted-foreground hover:text-primary transition-all"
              >
                <BookMarked className="w-4 h-4" />
                {t('bookmarks')}
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-lg text-muted-foreground hover:text-primary transition-all"
              >
                <Search className="w-4 h-4" />
                {t('searchQuran')}
              </button>
            </div>

            {/* ── Continue reading ── */}
            {lastRead && (
              <Link
                href={`/quran/surah/${lastRead.surahNumber}?ayah=${lastRead.ayahNumber}`}
                className="flex items-center gap-3 w-full p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base text-muted-foreground">{t('continueReading')}</p>
                  <p className="text-lg font-semibold text-foreground truncate">{t('surahAyah', { surahName: lastRead.surahName, ayahNumber: n(lastRead.ayahNumber) })}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">

          {/* ── Content ── */}
          {mode === 'mushaf'  && <MushafSection editions={editions} />}
          {mode === 'text'    && <TextSection surahs={surahs} search={search} onSearch={setSearch} hrefPrefix="/quran/surah" />}
          {mode === 'tilawat' && <TextSection surahs={surahs} search={search} onSearch={setSearch} hrefPrefix="/quran/tilawat" />}
        </div>
      </div>
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
        'relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left',
        active
          ? 'border-primary bg-primary/8 shadow-sm'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card'
      )}
    >
      <div className={cn(
        'w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={cn('font-bold text-lg', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
        <p className="text-base text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </button>
  )
}

// ─── Mushaf section ───────────────────────────────────────────────────────────

function MushafSection({ editions }: { editions: MushafEdition[] }) {
  const t = useTranslations('QuranLanding')
  if (!editions.length) {
    return (
      <p className="text-center text-muted-foreground py-20">{t('mushafLoadError')}</p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
        {editions.map(e => <EditionCard key={e.id} edition={e} />)}
      </div>
    </div>
  )
}

function EditionCard({ edition }: { edition: MushafEdition }) {
  const t = useTranslations('QuranLanding')
  const locale = useLocale()
  const n = (val: number | string) => locale === 'bn' ? bn(val) : val
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
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-2 py-0.5 rounded-full">
          {t('pageCount', { count: n(edition.totalPages) })}
        </div>
      </div>
      <div className="p-3.5 flex items-start justify-between gap-2">
        <p className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {edition.title}
        </p>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
      </div>
    </Link>
  )
}

// ─── Text / Surah list section (also reused for tilawat mode's surah picker) ──

function TextSection({ surahs, search, onSearch, hrefPrefix }: {
  surahs: QuranSurah[]
  search: string
  onSearch: (v: string) => void
  hrefPrefix: string
}) {
  const t = useTranslations('QuranLanding')
  const locale = useLocale()
  const n = (val: number | string) => locale === 'bn' ? bn(val) : val
  const REVELATION_LABEL: Record<string, string> = {
    Meccan: t('meccan'),
    Medinan: t('medinan'),
  }
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
          placeholder={t('searchSurah')}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted text-lg focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Surah grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
        {filtered.map(surah => (
          <Link
            key={surah.number}
            href={`${hrefPrefix}/${surah.number}`}
            className="group flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            {/* Number badge */}
            <div className="w-9 h-9 shrink-0 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors tabular-nums">
              {n(surah.number)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-lg font-semibold text-foreground truncate">{surah.nameBengali}</p>
                <p className="text-xl text-muted-foreground shrink-0" style={{ fontFamily: DEFAULT_ARABIC_FONT, direction: 'rtl' }}>
                  {surah.nameArabic}
                </p>
              </div>
              <p className="text-base text-muted-foreground mt-0.5">
                {t('surahMeta', {
                  ayahCount: n(surah.totalAyahs),
                  revelation: REVELATION_LABEL[surah.revelationType] ?? surah.revelationType,
                  para: n(surah.paraNumber),
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-16">{t('noSurahFound')}</p>
      )}
    </div>
  )
}
