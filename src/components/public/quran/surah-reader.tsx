'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, ChevronDown, ArrowLeft,
  Play, Pause, SkipBack, SkipForward, Volume2, Settings, X,
  Copy, Share2, Bookmark, MoreHorizontal, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuranSurahDetail, QuranSurah, QuranAyah } from '@/types'

const TRANSLATORS = [
  { key: 'মুফতী তাকী উসমানী', label: 'মুফতী তাকী উসমানী' },
  { key: 'মাওলানা মুহিউদ্দিন খান', label: 'মাওলানা মুহিউদ্দিন খান' },
  { key: 'ইসলামিক ফাউন্ডেশন', label: 'ইসলামিক ফাউন্ডেশন' },
  { key: 'Taqi Usmani', label: 'Taqi Usmani (English)' },
]

const AUDIO_BASE = 'https://static.islamijindegi.com/audio/quran'

const NAV_TABS = [
  { id: 'surah', label: 'সূরা' },
  { id: 'verse', label: 'আয়াত' },
  { id: 'juz', label: 'পারা' },
  { id: 'page', label: 'পৃষ্ঠা' },
] as const

type NavTab = typeof NAV_TABS[number]['id']

interface Props {
  surah: QuranSurahDetail
  allSurahs: QuranSurah[]
}

export function SurahReader({ surah, allSurahs }: Props) {
  const router = useRouter()
  const [translator, setTranslator] = useState(TRANSLATORS[0].key)
  const [showWords, setShowWords] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNav, setShowNav] = useState(true)
  const [navTab, setNavTab] = useState<NavTab>('surah')
  const [activeAyah, setActiveAyah] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [surahSearch, setSurahSearch] = useState('')
  const [verseInput, setVerseInput] = useState('')
  const [pageInput, setPageInput] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ayahRefs = useRef<(HTMLDivElement | null)[]>([])

  const prevSurah = surah.number > 1 ? allSurahs.find(s => s.number === surah.number - 1) : null
  const nextSurah = surah.number < 114 ? allSurahs.find(s => s.number === surah.number + 1) : null

  // Group surahs by juz (paraNumber)
  const juzMap = allSurahs.reduce<Record<number, QuranSurah[]>>((acc, s) => {
    if (!acc[s.paraNumber]) acc[s.paraNumber] = []
    acc[s.paraNumber].push(s)
    return acc
  }, {})

  const getAudioUrl = useCallback((ayahNum: number) => {
    const s = String(surah.number).padStart(3, '0')
    const a = String(ayahNum).padStart(3, '0')
    return `${AUDIO_BASE}/${s}${a}.mp3`
  }, [surah.number])

  const playAyah = useCallback((ayahNum: number) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = getAudioUrl(ayahNum)
      audioRef.current.play().catch(() => setAudioError(true))
    }
    setActiveAyah(ayahNum)
    setIsPlaying(true)
    setAudioError(false)
    const idx = ayahNum - 1
    ayahRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [getAudioUrl])

  const handleEnded = useCallback(() => {
    if (activeAyah === null) return
    const next = activeAyah + 1
    if (next <= surah.totalAyahs) {
      playAyah(next)
    } else {
      setIsPlaying(false)
      setActiveAyah(null)
    }
  }, [activeAyah, surah.totalAyahs, playAyah])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (activeAyah === null) {
        playAyah(1)
      } else {
        audioRef.current.play().catch(() => setAudioError(true))
        setIsPlaying(true)
      }
    }
  }

  const skipBack = () => {
    if (activeAyah && activeAyah > 1) playAyah(activeAyah - 1)
    else playAyah(1)
  }

  const skipForward = () => {
    if (activeAyah && activeAyah < surah.totalAyahs) playAyah(activeAyah + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const changeTranslator = (t: string) => {
    router.replace(`/quran/surah/${surah.number}?translator=${encodeURIComponent(t)}`)
    setTranslator(t)
  }

  const filteredSurahs = surahSearch.trim()
    ? allSurahs.filter(s =>
        s.nameBengali.includes(surahSearch) ||
        s.transliteration.toLowerCase().includes(surahSearch.toLowerCase()) ||
        String(s.number).includes(surahSearch)
      )
    : allSurahs

  function jumpToVerse() {
    const n = parseInt(verseInput)
    if (!n || n < 1 || n > surah.totalAyahs) return
    ayahRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActiveAyah(n)
    setShowNav(false)
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
        <Link href="/quran" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <button
          onClick={() => setShowNav(v => !v)}
          className="flex-1 min-w-0 text-left group"
        >
          <div className="flex items-center gap-1">
            <h1 className="font-bold text-foreground text-base leading-tight truncate">{surah.nameBengali}</h1>
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', showNav && 'rotate-180')} />
          </div>
          <p className="text-xs text-muted-foreground">{surah.totalAyahs} আয়াত · {surah.revelationType === 'Meccan' ? 'মক্কী' : 'মাদানী'} · পারা {surah.paraNumber}</p>
        </button>

        <p className="text-2xl text-muted-foreground" style={{ fontFamily: 'serif', direction: 'rtl' }}>{surah.nameArabic}</p>

        <button
          onClick={() => setShowSettings(s => !s)}
          className={cn('p-1.5 rounded-lg transition-colors', showSettings ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
          title="সেটিংস"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className="border-b border-border bg-muted/30 px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">অনুবাদ</p>
              <div className="flex flex-wrap gap-2">
                {TRANSLATORS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => changeTranslator(t.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                      translator === t.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">শব্দার্থ</p>
              <button
                onClick={() => setShowWords(w => !w)}
                className={cn('relative w-10 h-5 rounded-full transition-colors', showWords ? 'bg-primary' : 'bg-muted')}
              >
                <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', showWords ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation panel ── */}
      {showNav && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNav(false)} />
          <div className="relative w-80 max-w-[90vw] h-full bg-background flex flex-col shadow-2xl">

            {/* Tabs + X in one row */}
            <div className="flex items-center border-b border-border shrink-0">
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setNavTab(tab.id)}
                  className={cn(
                    'flex-1 py-3 text-xs font-semibold transition-colors',
                    navTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
              <button onClick={() => setShowNav(false)} className="px-3 py-3 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto flex flex-col">

              {/* ── সূরা tab ── */}
              {navTab === 'surah' && (
                <>
                  <div className="px-3 pt-3 pb-2 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        value={surahSearch}
                        onChange={e => setSurahSearch(e.target.value)}
                        placeholder="সূরা খুঁজুন..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredSurahs.map(s => (
                      <Link
                        key={s.number}
                        href={`/quran/surah/${s.number}`}
                        onClick={() => setShowNav(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors',
                          s.number === surah.number && 'bg-primary/10 text-primary'
                        )}
                      >
                        <span className="w-6 text-right text-xs font-bold text-muted-foreground tabular-nums shrink-0">{s.number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{s.nameBengali}</p>
                          <p className="text-xs text-muted-foreground">{s.totalAyahs} আয়াত</p>
                        </div>
                        <p className="text-base text-muted-foreground shrink-0" style={{ fontFamily: 'serif', direction: 'rtl' }}>{s.nameArabic}</p>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* ── আয়াত tab ── */}
              {navTab === 'verse' && (
                <div className="px-4 pt-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{surah.nameBengali} · মোট {surah.totalAyahs} আয়াত</p>
                    <p className="text-sm font-medium text-foreground mb-3">আয়াত নম্বর দিয়ে যান</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={surah.totalAyahs}
                        value={verseInput}
                        onChange={e => setVerseInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && jumpToVerse()}
                        placeholder={`১ – ${surah.totalAyahs}`}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={jumpToVerse}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        যান
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">সকল আয়াত</p>
                    <div className="space-y-0.5">
                      {surah.ayahs.map(a => (
                        <button
                          key={a.number}
                          onClick={() => {
                            ayahRefs.current[a.number - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            setActiveAyah(a.number)
                            setShowNav(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-muted',
                            activeAyah === a.number && 'bg-primary/10 text-primary'
                          )}
                        >
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-muted shrink-0">{a.number}</span>
                          <p className="text-sm text-muted-foreground truncate">{a.translations[0]?.text?.slice(0, 50) ?? ''}…</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── পারা tab ── */}
              {navTab === 'juz' && (
                <div className="flex-1 overflow-y-auto">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(juzNum => {
                    const surahs = juzMap[juzNum] ?? []
                    const firstSurah = surahs[0]
                    if (!firstSurah) return null
                    const isCurrentJuz = surah.paraNumber === juzNum
                    return (
                      <Link
                        key={juzNum}
                        href={`/quran/surah/${firstSurah.number}`}
                        onClick={() => setShowNav(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted transition-colors',
                          isCurrentJuz && 'bg-primary/10'
                        )}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                          isCurrentJuz ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {juzNum}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-semibold', isCurrentJuz && 'text-primary')}>পারা {juzNum}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {surahs.map(s => s.nameBengali).join(', ')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* ── পৃষ্ঠা tab ── */}
              {navTab === 'page' && (
                <div className="px-4 pt-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">পৃষ্ঠা নম্বর দিয়ে যান</p>
                  <p className="text-xs text-muted-foreground">কুরআনের পৃষ্ঠা ১ – ৬০৪</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={604}
                      value={pageInput}
                      onChange={e => setPageInput(e.target.value)}
                      placeholder="পৃষ্ঠা নম্বর"
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      যান
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground/60">পৃষ্ঠা-ভিত্তিক নেভিগেশন শীঘ্রই আসছে।</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Surah header ── */}
      <div className="text-center py-8 border-b border-border/50">
        <p className="text-4xl sm:text-5xl text-foreground mb-2" style={{ fontFamily: 'serif', direction: 'rtl', lineHeight: 1.6 }}>
          {surah.nameArabic}
        </p>
        <p className="text-lg font-semibold text-foreground">{surah.nameBengali}</p>
        <p className="text-sm text-muted-foreground mt-1">{surah.nameEnglish} · {surah.totalAyahs} আয়াত</p>
        {surah.number !== 1 && surah.number !== 9 && (
          <p className="mt-4 text-xl text-foreground" style={{ fontFamily: 'serif', direction: 'rtl' }}>
            بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ
          </p>
        )}
      </div>

      {/* ── Ayahs ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-0">
        {surah.ayahs.map((ayah, i) => (
          <AyahCard
            key={ayah.number}
            ayah={ayah}
            translator={translator}
            showWords={showWords}
            isActive={activeAyah === ayah.number}
            onPlay={() => playAyah(ayah.number)}
            ref={el => { ayahRefs.current[i] = el }}
          />
        ))}
      </div>

      {/* ── Prev / Next surah ── */}
      <div className="max-w-2xl mx-auto w-full px-4 pb-32 grid grid-cols-2 gap-3">
        {prevSurah ? (
          <Link
            href={`/quran/surah/${prevSurah.number}`}
            className="flex items-center gap-2 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">আগের সূরা</p>
              <p className="text-sm font-semibold truncate group-hover:text-primary">{prevSurah.nameBengali}</p>
            </div>
          </Link>
        ) : <div />}
        {nextSurah && (
          <Link
            href={`/quran/surah/${nextSurah.number}`}
            className="flex items-center justify-end gap-2 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="min-w-0 text-right">
              <p className="text-xs text-muted-foreground">পরের সূরা</p>
              <p className="text-sm font-semibold truncate group-hover:text-primary">{nextSurah.nameBengali}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary" />
          </Link>
        )}
      </div>

      {/* ── Sticky audio player ── */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {activeAyah !== null ? (
              <p className="text-sm text-muted-foreground truncate">
                {surah.nameBengali} · আয়াত {activeAyah}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">অডিও বাজান</p>
            )}
            {audioError && <p className="text-xs text-destructive">অডিও পাওয়া যায়নি</p>}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={skipBack}
              disabled={!activeAyah || activeAyah <= 1}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={skipForward}
              disabled={!activeAyah || activeAyah >= surah.totalAyahs}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Ayah card ────────────────────────────────────────────────────────────────

import { forwardRef } from 'react'

const AyahCard = forwardRef<HTMLDivElement, {
  ayah: QuranAyah
  translator: string
  showWords: boolean
  isActive: boolean
  onPlay: () => void
}>(function AyahCard({ ayah, translator, showWords, isActive, onPlay }, ref) {
  const translation = ayah.translations.find(t => t.translator === translator)
  const [bookmarked, setBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = `${ayah.arabic}\n${translation?.text ?? ''}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleShare() {
    const text = `${ayah.arabic}\n${translation?.text ?? ''}`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'py-6 border-b border-border/60 transition-colors',
        isActive && 'bg-primary/5 -mx-4 px-4 rounded-lg border-primary/20'
      )}
    >
      {/* Ayah number + actions row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPlay}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
          )}
          title={`আয়াত ${ayah.number} বাজান`}
        >
          {ayah.number}
        </button>

        <div className="flex items-center gap-0.5">
          {isActive && (
            <div className="flex gap-0.5 items-end h-4 mr-2">
              {[1, 2, 3].map(i => (
                <span key={i} className="w-0.5 bg-primary rounded-full animate-bounce" style={{ height: `${[60, 100, 40][i-1]}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}
          <button
            onClick={handleCopy}
            title="কপি করুন"
            className={cn('p-1.5 rounded-md transition-colors', copied ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShare}
            title="শেয়ার করুন"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setBookmarked(b => !b)}
            title="বুকমার্ক"
            className={cn('p-1.5 rounded-md transition-colors', bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
          >
            <Bookmark className={cn('w-3.5 h-3.5', bookmarked && 'fill-current')} />
          </button>
          <button
            title="আরো"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Arabic */}
      <p
        className="text-right text-2xl sm:text-3xl leading-[2.2] text-foreground mb-5"
        style={{ fontFamily: 'serif', direction: 'rtl' }}
      >
        {ayah.arabic}
      </p>

      {/* Word-by-word */}
      {showWords && ayah.words.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end mb-4 p-3 rounded-xl bg-muted/40" dir="rtl">
          {ayah.words.map(w => (
            <div key={w.id} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-background border border-border">
              <span className="text-base text-foreground" style={{ fontFamily: 'serif' }}>{w.arabic}</span>
              <span className="text-[11px] text-muted-foreground">{w.bengali}</span>
            </div>
          ))}
        </div>
      )}

      {/* Translation */}
      {translation && (
        <p className="text-base text-muted-foreground leading-relaxed">{translation.text}</p>
      )}
    </div>
  )
})
