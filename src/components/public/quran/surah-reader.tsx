'use client'

import { useState, useEffect, useRef, useCallback, forwardRef, type CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import {
  ChevronLeft, ChevronRight, ChevronDown, ArrowLeft,
  Play, Pause, SkipBack, SkipForward, Volume2, Settings, X,
  Copy, Share2, Bookmark, BookOpenText, Search, Loader2,
  Repeat, Type, BookMarked, AlignJustify,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { QuranSurahDetail, QuranSurah, QuranAyah, QuranReciter, SuraAudioUrls, AyahBox } from '@/types'
import { TafsirModal } from './tafsir-modal'
import { QuranSearchModal } from './quran-search-modal'
import { BookmarksModal } from './bookmarks-modal'
import { isBookmarked, toggleBookmark } from '@/lib/quran-bookmarks'
import { setLastRead } from '@/lib/quran-last-read'
import { ARABIC_FONTS, BENGALI_FONTS, ARABIC_FONT_KEY, BENGALI_FONT_KEY, arabicFontFamily as resolveArabicFont, bengaliFontFamily as resolveBengaliFont } from '@/lib/quran-fonts'
import { bn } from '@/lib/bengali-numerals'

const DEFAULT_TRANSLATOR = 'মুফতী তাকী উসমানী'
const DEFAULT_RECITER = 'qari-maher-al-muaiqly'
const TRANSLATORS_KEY = 'quran_selected_translators'
const RECITER_KEY = 'quran_selected_reciter'
const ARABIC_SIZE_KEY = 'quran_arabic_font_size'
const BENGALI_SIZE_KEY = 'quran_bengali_font_size'

const ARABIC_SIZE_MIN = 22
const ARABIC_SIZE_MAX = 48
const ARABIC_SIZE_DEFAULT = 30
const BENGALI_SIZE_MIN = 13
const BENGALI_SIZE_MAX = 24
const BENGALI_SIZE_DEFAULT = 16

const AUTO_SCROLL_SPEEDS = [0.5, 1, 1.5, 2, 3]

// Madani edition is the closest to the standard 1–606 print-page numbering used for page-jump lookups.
const PAGE_JUMP_EDITION = 'madani'

const NAV_TAB_IDS = ['surah', 'verse', 'juz', 'page'] as const
type NavTab = typeof NAV_TAB_IDS[number]
const NAV_TAB_KEY = 'quran_nav_tab'

interface Props {
  surah: QuranSurahDetail
  allSurahs: QuranSurah[]
  reciters: QuranReciter[]
  translators: string[]
  initialAyah: number | null
}

export function SurahReader({ surah, allSurahs, reciters, translators, initialAyah }: Props) {
  const t = useTranslations('SurahReader')
  const router = useRouter()
  const NAV_TABS: { id: NavTab; label: string }[] = [
    { id: 'surah', label: t('navTabSurah') },
    { id: 'verse', label: t('navTabVerse') },
    { id: 'juz', label: t('navTabJuz') },
    { id: 'page', label: t('navTabPage') },
  ]
  const REVELATION_LABEL: Record<string, string> = {
    Meccan: t('meccan'),
    Medinan: t('medinan'),
  }

  const [selectedTranslators, setSelectedTranslators] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TRANSLATORS_KEY)
      if (saved) {
        try {
          const parsed: string[] = JSON.parse(saved)
          const valid = parsed.filter(t => translators.includes(t))
          if (valid.length > 0) return valid
        } catch { /* fall through to default */ }
      }
    }
    return translators.includes(DEFAULT_TRANSLATOR) ? [DEFAULT_TRANSLATOR] : translators.slice(0, 1)
  })

  const [selectedReciter, setSelectedReciter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECITER_KEY)
      if (saved && reciters.some(r => r.id === saved)) return saved
    }
    return reciters.some(r => r.id === DEFAULT_RECITER) ? DEFAULT_RECITER : (reciters[0]?.id ?? '')
  })

  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [audioLoading, setAudioLoading] = useState(false)

  const [showWords, setShowWords] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [navTab, setNavTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(NAV_TAB_KEY) as NavTab
      if (saved && NAV_TAB_IDS.includes(saved)) return saved
    }
    return 'surah'
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)

  // ── Font customization ──────────────────────────────────────────────────────
  const [arabicFontKey, setArabicFontKey] = useState(() =>
    (typeof window !== 'undefined' && localStorage.getItem(ARABIC_FONT_KEY)) || ARABIC_FONTS[0].key
  )
  const [bengaliFontKey, setBengaliFontKey] = useState(() =>
    (typeof window !== 'undefined' && localStorage.getItem(BENGALI_FONT_KEY)) || BENGALI_FONTS[0].key
  )
  const [arabicSize, setArabicSize] = useState(() => {
    const saved = typeof window !== 'undefined' ? Number(localStorage.getItem(ARABIC_SIZE_KEY)) : NaN
    return saved >= ARABIC_SIZE_MIN && saved <= ARABIC_SIZE_MAX ? saved : ARABIC_SIZE_DEFAULT
  })
  const [bengaliSize, setBengaliSize] = useState(() => {
    const saved = typeof window !== 'undefined' ? Number(localStorage.getItem(BENGALI_SIZE_KEY)) : NaN
    return saved >= BENGALI_SIZE_MIN && saved <= BENGALI_SIZE_MAX ? saved : BENGALI_SIZE_DEFAULT
  })
  const arabicFont = resolveArabicFont(arabicFontKey)
  const bengaliFont = resolveBengaliFont(bengaliFontKey)

  useEffect(() => { localStorage.setItem(ARABIC_FONT_KEY, arabicFontKey) }, [arabicFontKey])
  useEffect(() => { localStorage.setItem(BENGALI_FONT_KEY, bengaliFontKey) }, [bengaliFontKey])
  useEffect(() => { localStorage.setItem(ARABIC_SIZE_KEY, String(arabicSize)) }, [arabicSize])
  useEffect(() => { localStorage.setItem(BENGALI_SIZE_KEY, String(bengaliSize)) }, [bengaliSize])
  useEffect(() => { sessionStorage.setItem(NAV_TAB_KEY, navTab) }, [navTab])

  const quranFontVars = {
    '--quran-arabic-font': arabicFont,
    '--quran-bengali-font': bengaliFont,
    '--quran-arabic-size': `${arabicSize}px`,
    '--quran-bengali-size': `${bengaliSize}px`,
  } as CSSProperties

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  const [autoScroll, setAutoScroll] = useState(false)
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!autoScroll) return
    let raf: number
    const step = () => {
      const el = scrollContainerRef.current
      if (el) {
        el.scrollTop += 0.4 * autoScrollSpeed
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          setAutoScroll(false)
          return
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, autoScrollSpeed])

  // ── Audio range + repeat ────────────────────────────────────────────────────
  const [tilawatOpen, setTilawatOpen] = useState(false)
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(1)
  const [fullSurah, setFullSurah] = useState(false)
  const [repeatCount, setRepeatCount] = useState(1)
  const [activeRange, setActiveRange] = useState<{ start: number; end: number; repeatsLeft: number } | null>(null)

  // ── Page-jump (text mode) ───────────────────────────────────────────────────
  const [pageMap, setPageMap] = useState<Map<number, { sura: number; ayah: number }> | null>(null)
  const [pageMapLoading, setPageMapLoading] = useState(false)
  const [pageJumpError, setPageJumpError] = useState(false)

  useEffect(() => {
    if (window.innerWidth >= 1024) setShowNav(true)
  }, [])
  const [activeAyah, setActiveAyah] = useState<number | null>(null)
  const [playerVisible, setPlayerVisible] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [surahSearch, setSurahSearch] = useState('')
  const [selectedNavSurah, setSelectedNavSurah] = useState<QuranSurah>(
    () => allSurahs.find(s => s.number === surah.surahNumber) ?? { ...surah, number: surah.surahNumber }
  )
  const [pageInput, setPageInput] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ayahRefs = useRef<(HTMLDivElement | null)[]>([])

  const prevSurah = surah.surahNumber > 1 ? allSurahs.find(s => s.number === surah.surahNumber - 1) : null
  const nextSurah = surah.surahNumber < 114 ? allSurahs.find(s => s.number === surah.surahNumber + 1) : null

  // Group surahs by juz (paraNumber)
  const juzMap = allSurahs.reduce<Record<number, QuranSurah[]>>((acc, s) => {
    if (!acc[s.paraNumber]) acc[s.paraNumber] = []
    acc[s.paraNumber].push(s)
    return acc
  }, {})

  // ── Persist selections ──────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(TRANSLATORS_KEY, JSON.stringify(selectedTranslators))
  }, [selectedTranslators])

  useEffect(() => {
    if (selectedReciter) localStorage.setItem(RECITER_KEY, selectedReciter)
  }, [selectedReciter])

  function toggleTranslator(name: string) {
    setSelectedTranslators(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }

  // ── Reciter audio URLs (presigned, expire after 5 min) ─────────────────────
  const fetchAudioUrls = useCallback(async () => {
    if (!selectedReciter) return
    setAudioLoading(true)
    try {
      const res = await api.post<SuraAudioUrls>('/api/quran/sura-audio-urls', { reciterId: selectedReciter, sura: surah.surahNumber })
      setAudioUrls(res.urls)
    } catch {
      setAudioUrls([])
    } finally {
      setAudioLoading(false)
    }
  }, [selectedReciter, surah.surahNumber])

  useEffect(() => { fetchAudioUrls() }, [fetchAudioUrls])

  const playAyah = useCallback((ayahNum: number) => {
    const url = audioUrls[ayahNum - 1]
    setActiveAyah(ayahNum)
    setPlayerVisible(true)
    setAudioError(false)
    const idx = ayahNum - 1
    ayahRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    if (!url) {
      setAudioError(true)
      setIsPlaying(false)
      fetchAudioUrls() // URLs may have expired or not loaded yet — refresh for the next attempt
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = url
      audioRef.current.play().catch(() => {
        setAudioError(true)
        fetchAudioUrls()
      })
    }
    setIsPlaying(true)
  }, [audioUrls, fetchAudioUrls])

  const handleEnded = useCallback(() => {
    if (activeAyah === null) return

    if (activeRange) {
      const next = activeAyah + 1
      if (next <= activeRange.end) {
        playAyah(next)
        return
      }
      if (activeRange.repeatsLeft > 1) {
        setActiveRange(r => r ? { ...r, repeatsLeft: r.repeatsLeft - 1 } : null)
        playAyah(activeRange.start)
        return
      }
      setActiveRange(null)
      setIsPlaying(false)
      setActiveAyah(null)
      setPlayerVisible(false)
      return
    }

    const next = activeAyah + 1
    if (next <= surah.totalAyahs) {
      playAyah(next)
    } else {
      setIsPlaying(false)
      setActiveAyah(null)
      setPlayerVisible(false)
    }
  }, [activeAyah, activeRange, surah.totalAyahs, playAyah])

  function startRangePlayback() {
    const start = fullSurah ? 1 : Math.max(1, Math.min(rangeStart, rangeEnd))
    const end = fullSurah ? surah.totalAyahs : Math.min(surah.totalAyahs, Math.max(rangeStart, rangeEnd))
    const repeats = Math.max(1, repeatCount)
    setActiveRange({ start, end, repeatsLeft: repeats })
    setTilawatOpen(false)
    playAyah(start)
  }

  function stopRangePlayback() {
    setActiveRange(null)
  }

  const playSingleAyah = useCallback((ayahNum: number) => {
    setActiveRange({ start: ayahNum, end: ayahNum, repeatsLeft: 1 })
    playAyah(ayahNum)
  }, [playAyah])

  function stopPlayback() {
    audioRef.current?.pause()
    setIsPlaying(false)
    setActiveRange(null)
    setActiveAyah(null)
    setPlayerVisible(false)
  }

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
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tilawatOpen) return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (!tilawatOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTilawatOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tilawatOpen])

  // ── Deep-link to a specific ayah (e.g. from search results) ────────────────
  useEffect(() => {
    if (!initialAyah) return
    const idx = initialAyah - 1
    setActiveAyah(initialAyah)
    const t = setTimeout(() => {
      ayahRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    return () => clearTimeout(t)
  }, [initialAyah, surah.surahNumber])

  // ── Continue-reading: persist last viewed ayah ──────────────────────────────
  useEffect(() => {
    if (activeAyah !== null) {
      setLastRead({ surahNumber: surah.surahNumber, surahName: surah.nameBengali, ayahNumber: activeAyah })
    }
  }, [activeAyah, surah.surahNumber, surah.nameBengali])

  // ── Page-jump: lazily build a page→(surah,ayah) map from the madani mushaf's ayah boxes ──
  useEffect(() => {
    if (navTab !== 'page' || pageMap || pageMapLoading) return
    setPageMapLoading(true)
    fetch(`/api/quran/mushaf/${PAGE_JUMP_EDITION}/ayah-boxes`)
      .then(r => r.json())
      .then((boxes: AyahBox[]) => {
        const byPage = new Map<number, AyahBox[]>()
        for (const b of boxes) {
          if (!byPage.has(b.page_number)) byPage.set(b.page_number, [])
          byPage.get(b.page_number)!.push(b)
        }
        const map = new Map<number, { sura: number; ayah: number }>()
        for (const [page, list] of byPage) {
          const top = list.reduce((a, b) => (a.min_y <= b.min_y ? a : b))
          map.set(page, { sura: top.sura_number, ayah: top.ayah_number })
        }
        setPageMap(map)
      })
      .catch(() => setPageMap(new Map()))
      .finally(() => setPageMapLoading(false))
  }, [navTab, pageMap, pageMapLoading])

  const maxPage = pageMap && pageMap.size > 0 ? Math.max(...pageMap.keys()) : null

  function goToPage() {
    setPageJumpError(false)
    const n = parseInt(pageInput, 10)
    if (isNaN(n) || !pageMap) { setPageJumpError(true); return }
    const target = pageMap.get(n)
    if (!target) { setPageJumpError(true); return }
    if (target.sura === surah.surahNumber) {
      ayahRefs.current[target.ayah - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setActiveAyah(target.ayah)
    } else {
      router.push(`/quran/surah/${target.sura}?ayah=${target.ayah}`)
    }
  }

  const filteredSurahs = surahSearch.trim()
    ? allSurahs.filter(s =>
        s.nameBengali.includes(surahSearch) ||
        s.transliteration.toLowerCase().includes(surahSearch.toLowerCase()) ||
        String(s.number).includes(surahSearch)
      )
    : allSurahs


  return (
    <div className="flex flex-col bg-background h-svh" style={quranFontVars}>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background z-10">
        <Link href="/quran?mode=text" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <button onClick={() => setShowNav(v => !v)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1">
            <h1 className="font-bold text-foreground text-base leading-tight truncate">{surah.nameBengali}</h1>
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', showNav && 'rotate-180')} />
          </div>
          <p className="text-xs text-muted-foreground">{t('surahMeta', { ayahCount: bn(surah.totalAyahs), revelation: REVELATION_LABEL[surah.revelationType] ?? surah.revelationType, para: bn(surah.paraNumber) })}</p>
        </button>

        <p className="text-2xl text-muted-foreground" style={{ fontFamily: 'var(--quran-arabic-font)', direction: 'rtl' }}>{surah.nameArabic}</p>

        <Link
          href={`/quran/tilawat/${surah.surahNumber}`}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={t('tilawatMode')}
        >
          <AlignJustify className="w-5 h-5" />
        </Link>

        <button
          onClick={() => setBookmarksOpen(true)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={t('bookmarksList')}
        >
          <BookMarked className="w-5 h-5" />
        </button>

        <button
          onClick={() => setSearchOpen(true)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={t('searchQuran')}
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowSettings(s => !s)}
          className={cn('p-1.5 rounded-lg transition-colors', showSettings ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
          title={t('settings')}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('translationLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {translators.map(name => (
                  <button
                    key={name}
                    onClick={() => toggleTranslator(name)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                      selectedTranslators.includes(name)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {reciters.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('reciter')}</p>
                <div className="flex flex-wrap gap-2">
                  {reciters.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReciter(r.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        selectedReciter === r.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('wordByWord')}</p>
              <button
                onClick={() => setShowWords(w => !w)}
                className={cn('relative w-10 h-5 rounded-full transition-colors', showWords ? 'bg-primary' : 'bg-muted')}
              >
                <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', showWords ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>

            {/* Font settings */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('arabicFont')}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ARABIC_FONTS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setArabicFontKey(f.key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        arabicFontKey === f.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <button
                    onClick={() => setArabicSize(s => Math.max(ARABIC_SIZE_MIN, s - 2))}
                    className="w-7 h-7 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/70 transition-colors"
                  >−</button>
                  <span className="text-xs text-muted-foreground w-8 text-center tabular-nums">{bn(arabicSize)}</span>
                  <button
                    onClick={() => setArabicSize(s => Math.min(ARABIC_SIZE_MAX, s + 2))}
                    className="w-7 h-7 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/70 transition-colors"
                  >+</button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('bengaliFont')}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {BENGALI_FONTS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setBengaliFontKey(f.key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        bengaliFontKey === f.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <button
                    onClick={() => setBengaliSize(s => Math.max(BENGALI_SIZE_MIN, s - 1))}
                    className="w-7 h-7 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/70 transition-colors"
                  >−</button>
                  <span className="text-xs text-muted-foreground w-8 text-center tabular-nums">{bn(bengaliSize)}</span>
                  <button
                    onClick={() => setBengaliSize(s => Math.min(BENGALI_SIZE_MAX, s + 1))}
                    className="w-7 h-7 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/70 transition-colors"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Auto-scroll */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('autoScroll')}</p>
                <button
                  onClick={() => setAutoScroll(v => !v)}
                  className={cn('relative w-10 h-5 rounded-full transition-colors', autoScroll ? 'bg-primary' : 'bg-muted')}
                >
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', autoScroll ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {AUTO_SCROLL_SPEEDS.map(sp => (
                  <button
                    key={sp}
                    onClick={() => setAutoScrollSpeed(sp)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs transition-colors',
                      autoScrollSpeed === sp
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {bn(sp)}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Body: nav sidebar + scrollable content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Nav sidebar — inline below top bar, no overlay */}
        {showNav && (
          <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden bg-background">

            {/* Tabs row */}
            <div className="flex items-center border-b border-border shrink-0">
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setNavTab(tab.id)}
                  className={cn(
                    'flex-1 py-3 text-base font-semibold transition-colors',
                    navTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
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
                        placeholder={t('searchSurah')}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-muted text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredSurahs.map(s => (
                      <Link
                        key={s.number}
                        href={`/quran/surah/${s.number}`}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors',
                          s.number === surah.surahNumber && 'bg-primary/10 text-primary'
                        )}
                      >
                        <span className="w-8 text-right text-base font-bold text-muted-foreground tabular-nums shrink-0">{bn(s.number)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold truncate">{s.nameBengali}</p>
                          <p className="text-base text-muted-foreground">{t('ayahCount', { count: bn(s.totalAyahs) })}</p>
                        </div>
                        <p className="text-xl text-muted-foreground shrink-0" style={{ fontFamily: 'var(--quran-arabic-font)', direction: 'rtl' }}>{s.nameArabic}</p>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* ── আয়াত tab ── */}
              {navTab === 'verse' && (
                <div className="flex flex-1 overflow-hidden">
                  {/* Left: surah list */}
                  <div className="flex-1 overflow-y-auto border-r border-border">
                    {allSurahs.map(s => (
                      <button
                        key={s.number}
                        onClick={() => setSelectedNavSurah(s)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted',
                          selectedNavSurah.number === s.number && 'bg-muted/60'
                        )}
                      >
                        <span className="text-base text-muted-foreground tabular-nums w-7 shrink-0">{bn(s.number)}</span>
                        <span className={cn('text-lg truncate', selectedNavSurah.number === s.number ? 'font-bold text-foreground' : 'text-muted-foreground')}>{s.nameBengali}</span>
                      </button>
                    ))}
                  </div>
                  {/* Right: verse numbers */}
                  <div className="w-14 overflow-y-auto shrink-0">
                    {Array.from({ length: selectedNavSurah.totalAyahs }, (_, i) => i + 1).map(n => {
                      const isCurrentVerse = selectedNavSurah.number === surah.surahNumber && activeAyah === n
                      return (
                        <button
                          key={n}
                          onClick={() => {
                            if (selectedNavSurah.number === surah.surahNumber) {
                              ayahRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              setActiveAyah(n)
                            } else {
                              router.push(`/quran/surah/${selectedNavSurah.number}?ayah=${n}`)
                            }
                          }}
                          className={cn(
                            'w-full py-2.5 text-lg text-center transition-colors hover:bg-muted',
                            isCurrentVerse ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'
                          )}
                        >
                          {bn(n)}
                        </button>
                      )
                    })}
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
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted transition-colors',
                          isCurrentJuz && 'bg-primary/10'
                        )}
                      >
                        <div className={cn(
                          'w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0',
                          isCurrentJuz ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {bn(juzNum)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-lg font-semibold', isCurrentJuz && 'text-primary')}>{t('para', { number: bn(juzNum) })}</p>
                          <p className="text-base text-muted-foreground truncate">
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
                  <p className="text-lg font-medium text-foreground">{t('goToPage')}</p>
                  <p className="text-base text-muted-foreground">
                    {t('pageRange', { max: maxPage ? bn(maxPage) : '…' })}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={maxPage ?? undefined}
                      value={pageInput}
                      onChange={e => setPageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') goToPage() }}
                      placeholder={t('pageNumber')}
                      disabled={pageMapLoading}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                    <button
                      onClick={goToPage}
                      disabled={pageMapLoading || !pageInput}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {pageMapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('go')}
                    </button>
                  </div>
                  {pageJumpError && (
                    <p className="text-base text-destructive">{t('invalidPage')}</p>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">

          {/* Surah header */}
          <div className="text-center py-8 border-b border-border/50">
            <p className="text-4xl sm:text-5xl text-foreground mb-2" style={{ fontFamily: 'var(--quran-arabic-font)', direction: 'rtl', lineHeight: 1.6 }}>
              {surah.nameArabic}
            </p>
            <p className="text-lg font-semibold text-foreground">{surah.nameBengali}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('surahMeta', { ayahCount: bn(surah.totalAyahs), revelation: REVELATION_LABEL[surah.revelationType] ?? surah.revelationType, para: bn(surah.paraNumber) })}
            </p>
            <button
              onClick={() => setTilawatOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Play className="w-4 h-4" />
              {t('listenTilawat')}
            </button>
            {surah.surahNumber !== 1 && surah.surahNumber !== 9 && (
              <p className="mt-4 text-xl text-foreground" style={{ fontFamily: 'var(--quran-arabic-font)', direction: 'rtl' }}>
                بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ
              </p>
            )}
          </div>

          {/* Ayahs */}
          <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-0">
            {surah.ayahs.map((ayah, i) => (
              <AyahCard
                key={ayah.number}
                ayah={ayah}
                surahNumber={surah.surahNumber}
                surahName={surah.nameBengali}
                selectedTranslators={selectedTranslators}
                showWords={showWords}
                isActive={activeAyah === ayah.number}
                onPlay={() => playAyah(ayah.number)}
                onPlaySingle={() => playSingleAyah(ayah.number)}
                onOpenTafsir={() => setTafsirAyah(ayah.number)}
                ref={el => { ayahRefs.current[i] = el }}
              />
            ))}
          </div>

          {/* Prev / Next surah */}
          <div className="max-w-2xl mx-auto w-full px-4 pb-6 grid grid-cols-2 gap-3">
            {prevSurah ? (
              <Link
                href={`/quran/surah/${prevSurah.number}`}
                className="flex items-center gap-2 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('prevSurah')}</p>
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
                  <p className="text-xs text-muted-foreground">{t('nextSurah')}</p>
                  <p className="text-sm font-semibold truncate group-hover:text-primary">{nextSurah.nameBengali}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary" />
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* ── Audio player — pinned to bottom, visible only while an audio session is active ── */}
      {playerVisible && activeAyah !== null && (
        <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
          {activeRange && (activeRange.end > activeRange.start || activeRange.repeatsLeft > 1) && (
            <div className="max-w-2xl mx-auto mb-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-xs">
              <span className="text-primary font-medium">
                {t('rangeRepeating', { start: bn(activeRange.start), end: bn(activeRange.end), left: bn(activeRange.repeatsLeft) })}
              </span>
              <button onClick={stopRangePlayback} className="text-muted-foreground hover:text-foreground transition-colors">{t('stop')}</button>
            </div>
          )}

          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                {t('surahAyah', { surahName: surah.nameBengali, ayahNumber: bn(activeAyah) })}
              </p>
              {audioError && <p className="text-xs text-destructive">{t('audioError')}</p>}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setTilawatOpen(true)}
                className={cn('p-2 rounded-lg transition-colors', activeRange ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
                title={t('rangeAndRepeat')}
              >
                <Repeat className="w-4 h-4" />
              </button>

              <button
                onClick={skipBack}
                disabled={activeAyah <= 1}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                disabled={audioLoading}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={skipForward}
                disabled={activeAyah >= surah.totalAyahs}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={stopPlayback}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={t('stop')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tilawat popup ── */}
      {tilawatOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={() => setTilawatOpen(false)} />

          <div className="relative w-full sm:max-w-md sm:mx-4 bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border">
              <p className="text-sm font-bold text-foreground">{t('listenTilawatTitle')}</p>
              <button
                onClick={() => setTilawatOpen(false)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-sm font-semibold text-foreground">{t('surahLabel')}</p>
                <select
                  value={surah.surahNumber}
                  onChange={e => router.push(`/quran/surah/${e.target.value}`)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {allSurahs.map(s => (
                    <option key={s.number} value={s.number}>{bn(s.number)}. {s.nameBengali}</option>
                  ))}
                </select>
              </div>

              {reciters.length > 0 && (
                <div className="flex items-center gap-3">
                  <p className="w-24 shrink-0 text-sm font-semibold text-foreground">{t('reciterLabel')}</p>
                  <select
                    value={selectedReciter}
                    onChange={e => setSelectedReciter(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {reciters.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-sm font-semibold text-foreground">{t('startAyah')}</p>
                <select
                  value={rangeStart}
                  disabled={fullSurah}
                  onChange={e => {
                    const n = Number(e.target.value)
                    setRangeStart(n)
                    if (n > rangeEnd) setRangeEnd(n)
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {Array.from({ length: surah.totalAyahs }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{bn(n)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-sm font-semibold text-foreground">{t('endAyah')}</p>
                <select
                  value={rangeEnd}
                  disabled={fullSurah}
                  onChange={e => {
                    const n = Number(e.target.value)
                    setRangeEnd(n)
                    if (n < rangeStart) setRangeStart(n)
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {Array.from({ length: surah.totalAyahs }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{bn(n)}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fullSurah}
                  onChange={e => setFullSurah(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium text-foreground">{t('fullSurah')}</span>
              </label>

              <div className="flex items-center justify-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/40">
                <span className="text-sm font-medium text-foreground">{t('ayahRepeat')}</span>
                <button
                  onClick={() => setRepeatCount(c => Math.max(1, c - 1))}
                  className="w-7 h-7 rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >−</button>
                <span className="text-sm text-muted-foreground w-6 text-center tabular-nums">{bn(repeatCount)}</span>
                <button
                  onClick={() => setRepeatCount(c => Math.min(20, c + 1))}
                  className="w-7 h-7 rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >+</button>
              </div>

              <button
                onClick={startRangePlayback}
                disabled={audioLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {t('listenAudio')}
              </button>
            </div>
          </div>
        </div>
      )}

      {searchOpen && <QuranSearchModal onClose={() => setSearchOpen(false)} />}
      {bookmarksOpen && <BookmarksModal onClose={() => setBookmarksOpen(false)} />}
      {tafsirAyah !== null && (
        <TafsirModal
          surahNumber={surah.surahNumber}
          surahName={surah.nameBengali}
          ayahNumber={tafsirAyah}
          onClose={() => setTafsirAyah(null)}
        />
      )}
    </div>
  )
}

// ─── Ayah card ────────────────────────────────────────────────────────────────

const AyahCard = forwardRef<HTMLDivElement, {
  ayah: QuranAyah
  surahNumber: number
  surahName: string
  selectedTranslators: string[]
  showWords: boolean
  isActive: boolean
  onPlay: () => void
  onPlaySingle: () => void
  onOpenTafsir: () => void
}>(function AyahCard({ ayah, surahNumber, surahName, selectedTranslators, showWords, isActive, onPlay, onPlaySingle, onOpenTafsir }, ref) {
  const t = useTranslations('SurahReader')
  const shownTranslations = ayah.translations.filter(tr => selectedTranslators.includes(tr.translator))
  const [bookmarked, setBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setBookmarked(isBookmarked(surahNumber, ayah.number))
  }, [surahNumber, ayah.number])

  function handleBookmarkToggle() {
    setBookmarked(toggleBookmark({ surahNumber, ayahNumber: ayah.number, surahName, arabic: ayah.arabic }))
  }

  function handleCopy() {
    const text = [ayah.arabic, ...shownTranslations.map(tr => tr.text)].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleShare() {
    const text = [ayah.arabic, ...shownTranslations.map(tr => tr.text)].join('\n')
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
          title={t('playAyah', { number: bn(ayah.number) })}
        >
          {bn(ayah.number)}
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
            onClick={onPlaySingle}
            title={t('playThisAyah')}
            className={cn('p-1.5 rounded-md transition-colors', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title={t('copy')}
            className={cn('p-1.5 rounded-md transition-colors', copied ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShare}
            title={t('share')}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleBookmarkToggle}
            title={t('bookmark')}
            className={cn('p-1.5 rounded-md transition-colors', bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
          >
            <Bookmark className={cn('w-3.5 h-3.5', bookmarked && 'fill-current')} />
          </button>
          <button
            onClick={onOpenTafsir}
            title={t('viewTafsir')}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <BookOpenText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Arabic */}
      <p
        className="text-right leading-[2.2] text-foreground mb-5"
        style={{ fontFamily: 'var(--quran-arabic-font)', direction: 'rtl', fontSize: 'var(--quran-arabic-size)' }}
      >
        {ayah.arabic}
      </p>

      {/* Word-by-word */}
      {showWords && ayah.words.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end mb-4 p-3 rounded-xl bg-muted/40" dir="rtl">
          {ayah.words.map(w => (
            <div key={w.id} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-muted border border-border">
              <span className="text-base text-foreground" style={{ fontFamily: 'var(--quran-arabic-font)' }}>{w.arabic}</span>
              <span className="text-[11px] text-muted-foreground">{w.bengali}</span>
            </div>
          ))}
        </div>
      )}

      {/* Translations */}
      {shownTranslations.length > 0 && (
        <div className="space-y-3">
          {shownTranslations.map(tr => (
            <div key={tr.translator}>
              {shownTranslations.length > 1 && (
                <p className="text-xs font-semibold text-primary/80 mb-1">{tr.translator}</p>
              )}
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--quran-bengali-font)', fontSize: 'var(--quran-bengali-size)' }}>{tr.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
