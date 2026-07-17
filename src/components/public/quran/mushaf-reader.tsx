'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ZoomIn, ZoomOut, X,
  ChevronLeft, ChevronRight, ChevronDown, BookOpen,
  Star, Play, Pause, Copy, Check, Share2, Maximize, Minimize, Loader2, Trash2,
  Repeat, SkipBack, SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { MushafEdition, AyahBox, SuraAudioUrls, QuranAyahDetail, QuranReciter } from '@/types'
import { bn } from '@/lib/bengali-numerals'
import { getBookmarks, toggleBookmark, removeBookmark, BOOKMARKS_CHANGED_EVENT, type QuranBookmark } from '@/lib/quran-bookmarks'
import { getPageBookmarks, togglePageBookmark, removePageBookmark, type MushafPageBookmark } from '@/lib/mushaf-bookmarks'

// ─── Static data ──────────────────────────────────────────────────────────────

const SURA_NAMES = [
  'আল-ফাতিহা', 'আল-বাকারা', 'আলে-ইমরান', 'আন-নিসা', 'আল-মায়েদা',
  'আল-আনআম', 'আল-আরাফ', 'আল-আনফাল', 'আত-তাওবা', 'ইউনুস',
  'হুদ', 'ইউসুফ', 'আর-রাদ', 'ইবরাহীম', 'আল-হিজর',
  'আন-নাহল', 'আল-ইসরা', 'আল-কাহফ', 'মারইয়াম', 'ত্বাহা',
  'আল-আম্বিয়া', 'আল-হাজ্জ', 'আল-মুমিনুন', 'আন-নুর', 'আল-ফুরকান',
  'আশ-শুআরা', 'আন-নামল', 'আল-কাসাস', 'আল-আনকাবুত', 'আর-রুম',
  'লুকমান', 'আস-সাজদা', 'আল-আহযাব', 'সাবা', 'ফাতির',
  'ইয়া-সীন', 'আস-সাফফাত', 'সাদ', 'আয-যুমার', 'গাফির',
  'ফুসসিলাত', 'আশ-শুরা', 'আয-যুখরুফ', 'আদ-দুখান', 'আল-জাসিয়া',
  'আল-আহকাফ', 'মুহাম্মদ', 'আল-ফাতহ', 'আল-হুজুরাত', 'কাফ',
  'আয-যারিয়াত', 'আত-তুর', 'আন-নাজম', 'আল-কামার', 'আর-রাহমান',
  'আল-ওয়াকিয়া', 'আল-হাদীদ', 'আল-মুজাদিলা', 'আল-হাশর', 'আল-মুমতাহিনা',
  'আস-সাফ', 'আল-জুমুআ', 'আল-মুনাফিকুন', 'আত-তাগাবুন', 'আত-তালাক',
  'আত-তাহরীম', 'আল-মুলক', 'আল-কালাম', 'আল-হাক্কা', 'আল-মাআরিজ',
  'নুহ', 'আল-জিন', 'আল-মুযযাম্মিল', 'আল-মুদ্দাসসির', 'আল-কিয়ামা',
  'আল-ইনসান', 'আল-মুরসালাত', 'আন-নাবা', 'আন-নাযিআত', 'আবাসা',
  'আত-তাকবীর', 'আল-ইনফিতার', 'আল-মুতাফফিফীন', 'আল-ইনশিকাক', 'আল-বুরুজ',
  'আত-তারিক', 'আল-আলা', 'আল-গাশিয়া', 'আল-ফাজর', 'আল-বালাদ',
  'আশ-শামস', 'আল-লাইল', 'আদ-দুহা', 'আশ-শারহ', 'আত-তীন',
  'আল-আলাক', 'আল-কাদর', 'আল-বাইয়্যিনা', 'আয-যালযালা', 'আল-আদিয়াত',
  'আল-কারিয়া', 'আত-তাকাসুর', 'আল-আসর', 'আল-হুমাযা', 'আল-ফীল',
  'কুরাইশ', 'আল-মাউন', 'আল-কাওসার', 'আল-কাফিরুন', 'আন-নাসর',
  'আল-মাসাদ', 'আল-ইখলাস', 'আল-ফালাক', 'আন-নাস',
]

const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6,
]

const PARA_NAMES = [
  'আলিফ লাম মীম', 'সাইয়াকূল', 'তিলকার রুসুল', 'লান তানা-লু', 'ওয়াল মুহসানাত',
  'লা ইউহিব্বুল্লাহ', 'ওয়া ইযা সামিউ', 'ওয়া লাও আন্নানা', 'ক্বা-লাল মালাউ', 'ওয়া\'লামূ',
  'ইয়া\'তাযিরূন', 'ওয়ামা মিন দা-ব্বাহ', 'ওয়ামা উবাররিউ', 'রুবামা', 'সুবহা-নাল্লাযী',
  'ক্বা-লা আলাম', 'ইক্বতারাবা', 'ক্বাদ আফলাহা', 'ওয়া ক্বা-লাল্লাযীনা', 'আম্মান খালাক্বা',
  'উতলু মা ঊহিয়া', 'ওয়া মাই ইয়াক্বনুত', 'ওয়া মা-লিয়া', 'ফামান আযলামু', 'ইলাইহি ইউরাদ্দু',
  'হা-মীম', 'ক্বা-লা ফামা খাতবুকুম', 'ক্বাদ সামি\'আল্লাহু', 'তাবা-রাকাল্লাযী', 'আম্মা',
]

// First (sura, ayah) of each of the 30 paras — same source data as the mobile app.
const PARA_STARTS: [number, number][] = [
  [2, 1], [2, 142], [2, 253], [3, 93], [4, 24],
  [4, 148], [5, 83], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1],
  [18, 75], [21, 1], [23, 1], [25, 21], [27, 60],
  [29, 46], [33, 31], [36, 22], [39, 32], [41, 47],
  [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
]

const DEFAULT_RECITER = 'qari-maher-al-muaiqly'
const RECITER_KEY = 'quran_selected_reciter'
const SPREAD_MODE_KEY = 'mushaf_spread_mode'

// Reserved space (px) so the page image never renders underneath the top/bottom bars —
// tightened to the bars' actual measured height (no extra padding) to maximize page size
const TOP_BAR_SAFE = 60
const BOTTOM_BAR_SAFE = 72

function paraOfSuraAyah(sura: number, ayah: number): number {
  let para = 1
  PARA_STARTS.forEach(([s, a], i) => {
    if (sura > s || (sura === s && ayah >= a)) para = i + 1
  })
  return para
}

// Physical mushaf pairing: page 1 opens alone; from page 2 onward pages pair up as
// (even=right, even+1=left) — matches how an RTL book actually opens.
function getSpreadPair(p: number, totalPages: number): { right: number; left: number | null } {
  if (p <= 1) return { right: 1, left: null }
  const right = p % 2 === 0 ? p : p - 1
  const left = right + 1
  return { right, left: left <= totalPages ? left : null }
}

const DRAWER_TABS = [
  { id: 'surah', label: 'সূরা' },
  { id: 'juz', label: 'পারা' },
  { id: 'bookmarks', label: 'বুকমার্ক' },
] as const

type DrawerTab = typeof DRAWER_TABS[number]['id']

// ─── One page face (image + ayah highlights + tap target) ────────────────────

function PageFace({ pageNum, url, highlightBoxes, editionWidth, editionHeight, onClick, className }: {
  pageNum: number
  url: string
  highlightBoxes: AyahBox[]
  editionWidth: number
  editionHeight: number
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void
  className?: string
}) {
  return (
    <div className={cn('relative cursor-pointer', className)} onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={url}
        src={url}
        alt={`পৃষ্ঠা ${bn(pageNum)}`}
        className="w-full h-full block bg-white shadow-[0_4px_32px_rgba(0,0,0,0.25)]"
        draggable={false}
      />
      {highlightBoxes.map(box => (
        <div
          key={box.box_id}
          className="absolute rounded-[3px] pointer-events-none"
          style={{
            left:   `${(box.min_x / editionWidth)  * 100}%`,
            top:    `${(box.min_y / editionHeight) * 100}%`,
            width:  `${((box.max_x - box.min_x) / editionWidth)  * 100}%`,
            height: `${((box.max_y - box.min_y) / editionHeight) * 100}%`,
            background: 'rgba(34,197,94,0.22)',
            border: '1.5px solid rgba(34,197,94,0.6)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  edition: MushafEdition
  initialPage: number
  reciters: QuranReciter[]
}

function MushafReaderInner({ edition, initialPage, reciters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── State ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`mushaf_${edition.id}`)
      if (saved) return Math.max(1, Math.min(edition.totalPages, Number(saved)))
    }
    return initialPage
  })
  const [spreadMode, setSpreadMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(SPREAD_MODE_KEY) === '1'
    return false
  })
  const [scale, setScale] = useState(1)
  const [barsVisible, setBarsVisible] = useState(true)
  const [allBoxes, setAllBoxes] = useState<AyahBox[]>([])
  const [boxesLoading, setBoxesLoading] = useState(true)
  const [selectedAyah, setSelectedAyah] = useState<{ sura: number; ayah: number } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('surah')
  const [navSurah, setNavSurah] = useState(1)
  const [navPara, setNavPara] = useState(1)
  const [bookmarkTab, setBookmarkTab] = useState<'ayah' | 'page'>('ayah')
  const [ayahBookmarks, setAyahBookmarks] = useState<QuranBookmark[]>([])
  const [pageBookmarks, setPageBookmarks] = useState<MushafPageBookmark[]>(() => getPageBookmarks(edition.id))
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [editingPage, setEditingPage] = useState(false)
  const [pageInput, setPageInput] = useState('')

  // Ayah menu action state
  const [copied, setCopied] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  // ── Tilawat (recitation) playback state — mirrors the surah text reader ────
  const [selectedReciter, setSelectedReciter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECITER_KEY)
      if (saved && reciters.some(r => r.id === saved)) return saved
    }
    return reciters.some(r => r.id === DEFAULT_RECITER) ? DEFAULT_RECITER : (reciters[0]?.id ?? DEFAULT_RECITER)
  })
  const [tilawatOpen, setTilawatOpen] = useState(false)
  const [tilawatSura, setTilawatSura] = useState(1)
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(1)
  const [fullSurah, setFullSurah] = useState(false)
  const [repeatCount, setRepeatCount] = useState(1)
  const [activeRange, setActiveRange] = useState<{ sura: number; start: number; end: number; repeatsLeft: number } | null>(null)
  const [activeAyah, setActiveAyah] = useState<{ sura: number; ayah: number } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState(false)

  useEffect(() => {
    if (selectedReciter) localStorage.setItem(RECITER_KEY, selectedReciter)
  }, [selectedReciter])

  useEffect(() => {
    localStorage.setItem(SPREAD_MODE_KEY, spreadMode ? '1' : '0')
  }, [spreadMode])

  const containerRef = useRef<HTMLDivElement>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlCache = useRef<{ key: string; urls: string[]; at: number } | null>(null)

  // ── Container size ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Two-page spread pairing ─────────────────────────────────────────────────
  const spreadPair = useMemo(
    () => spreadMode ? getSpreadPair(page, edition.totalPages) : { right: page, left: null },
    [spreadMode, page, edition.totalPages]
  )
  const rightPage = spreadPair.right
  const leftPage = spreadPair.left

  // ── Computed image bounds (combined spread box when two pages are shown) ──
  const imgBounds = useMemo(() => {
    const { w: cW, h: cH } = containerSize
    if (!cW || !cH) return null
    // Bars hidden (fullscreen) — nothing to avoid, use the full container
    const topSafe = barsVisible ? TOP_BAR_SAFE : 0
    const bottomSafe = barsVisible ? BOTTOM_BAR_SAFE : 0
    const availH = Math.max(0, cH - topSafe - bottomSafe)
    if (!availH) return null
    const showSpread = leftPage !== null
    const imageAR = edition.width / edition.height
    const combinedAR = showSpread ? imageAR * 2 : imageAR
    const containerAR = cW / availH
    let totalW: number, totalH: number
    if (containerAR > combinedAR) {
      totalH = availH; totalW = availH * combinedAR
    } else {
      totalW = cW; totalH = cW / combinedAR
    }
    return {
      w: totalW, h: totalH,
      x: (cW - totalW) / 2,
      y: topSafe + (availH - totalH) / 2,
      showSpread,
    }
  }, [containerSize, edition.width, edition.height, barsVisible, leftPage])

  // ── Load ayah boxes via same-origin proxy (avoids CDN CORS issues) ────────
  useEffect(() => {
    fetch(`/api/quran/mushaf/${edition.id}/ayah-boxes`)
      .then(r => r.json())
      .then((data: AyahBox[]) => { setAllBoxes(data); setBoxesLoading(false) })
      .catch(e => { console.error('Failed to load ayah boxes:', e); setBoxesLoading(false) })
  }, [edition.id])

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => setAyahBookmarks(getBookmarks())
    load()
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, load)
    return () => window.removeEventListener(BOOKMARKS_CHANGED_EVENT, load)
  }, [])

  // ── Mappings derived from ayah boxes (mirrors the mobile app's logic) ──────
  const boxesByPage = useMemo(() => {
    const map = new Map<number, AyahBox[]>()
    for (const box of allBoxes) {
      if (!map.has(box.page_number)) map.set(box.page_number, [])
      map.get(box.page_number)!.push(box)
    }
    return map
  }, [allBoxes])

  const suraFirstPage = useMemo(() => {
    const map = new Map<number, number>()
    for (const box of allBoxes) {
      const cur = map.get(box.sura_number)
      if (cur === undefined || box.page_number < cur) map.set(box.sura_number, box.page_number)
    }
    return map
  }, [allBoxes])

  const ayahFirstPage = useMemo(() => {
    const map = new Map<string, number>()
    for (const box of allBoxes) {
      const key = `${box.sura_number}:${box.ayah_number}`
      const cur = map.get(key)
      if (cur === undefined || box.page_number < cur) map.set(key, box.page_number)
    }
    // Known off-by-one corrections in older Hafizi ayah_boxes data (same as the app);
    // only triggers on the exact bad values, so other editions are unaffected.
    if (map.get('9:93') === 203) map.set('9:93', 204)
    if (map.get('15:1') === 263) map.set('15:1', 264)
    return map
  }, [allBoxes])

  const paraFirstPage = useMemo(() => {
    const map = new Map<number, number>()
    PARA_STARTS.forEach(([s, a], i) => {
      const p = ayahFirstPage.get(`${s}:${a}`)
      if (p !== undefined) map.set(i + 1, p)
    })
    return map
  }, [ayahFirstPage])

  const paraPageRanges = useMemo(() => {
    const map = new Map<number, number[]>()
    for (let i = 1; i <= 30; i++) {
      const start = paraFirstPage.get(i)
      const nextStart = paraFirstPage.get(i + 1)
      const end = i < 30 ? (nextStart !== undefined ? nextStart - 1 : undefined) : edition.totalPages
      if (start !== undefined && end !== undefined && start <= end) {
        map.set(i, Array.from({ length: end - start + 1 }, (_, k) => start + k))
      }
    }
    return map
  }, [paraFirstPage, edition.totalPages])

  const currentPara = useMemo(() => {
    for (const [para, pages] of paraPageRanges) {
      if (pages.includes(rightPage)) return para
    }
    return null
  }, [paraPageRanges, rightPage])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((p: number) => {
    const n = Math.max(1, Math.min(edition.totalPages, p))
    setPage(n)
    setSelectedAyah(null)
    localStorage.setItem(`mushaf_${edition.id}`, String(n))
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(n))
    router.replace(`?${params}`, { scroll: false })
  }, [edition, searchParams, router])

  const prev = useCallback(() => goTo(page - (spreadMode ? 2 : 1)), [page, goTo, spreadMode])
  const next = useCallback(() => goTo(page + (spreadMode ? 2 : 1)), [page, goTo, spreadMode])

  function goToAyah(sura: number, ayah: number) {
    const target = ayahFirstPage.get(`${sura}:${ayah}`)
    if (target === undefined) return
    goTo(target)
    setSelectedAyah({ sura, ayah })
  }

  function openDrawer() {
    const cs = boxesByPage.get(rightPage)?.[0]?.sura_number
    if (cs) setNavSurah(cs)
    if (currentPara) setNavPara(currentPara)
    setDrawerOpen(true)
  }

  function toggleDrawer() {
    if (drawerOpen) setDrawerOpen(false)
    else openDrawer()
  }

  // ── Preload adjacent pages ─────────────────────────────────────────────────
  useEffect(() => {
    const offsets = spreadMode ? [-3, -2, -1, 1, 2, 3] : [-2, -1, 1, 2]
    offsets.forEach(offset => {
      const p = page + offset
      if (p >= 1 && p <= edition.totalPages) {
        const img = new window.Image()
        img.src = `${edition.pagesBaseUrl}/qm${p}.${edition.ext}`
      }
    })
  }, [page, edition, spreadMode])

  // ── Keyboard navigation (RTL: left arrow = forward) ───────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingPage || drawerOpen) return
      if (e.key === 'ArrowLeft')  next()
      if (e.key === 'ArrowRight') prev()
      if (e.key === 'Escape') { setSelectedAyah(null); setDrawerOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, editingPage, drawerOpen])

  // ── Touch swipe (RTL: swipe right = forward, like flipping a mushaf page) ──
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || scale > 1) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta > 0) next(); else prev()
    }
    touchStartX.current = null
  }

  // ── Ayah hit detection — shared by whichever page face was tapped ─────────
  function handleAyahClick(e: React.MouseEvent<HTMLDivElement>, boxes: AyahBox[]) {
    // getBoundingClientRect returns visual (scaled) bounds — correct for our use
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    // Map rendered → original image coordinates
    const origX = (relX / rect.width)  * edition.width
    const origY = (relY / rect.height) * edition.height

    const hit = boxes.find(b =>
      origX >= b.min_x && origX <= b.max_x &&
      origY >= b.min_y && origY <= b.max_y
    )

    if (hit) {
      // Toggle: tap same ayah again to deselect — doesn't disturb fullscreen either way
      if (selectedAyah?.sura === hit.sura_number && selectedAyah?.ayah === hit.ayah_number) {
        setSelectedAyah(null)
      } else {
        setSelectedAyah({ sura: hit.sura_number, ayah: hit.ayah_number })
      }
    } else if (selectedAyah) {
      setSelectedAyah(null)
    } else {
      setBarsVisible(v => !v)
    }
  }

  // ── Ayah menu actions ──────────────────────────────────────────────────────
  const fetchArabic = useCallback(async (sura: number, ayah: number): Promise<string> => {
    try {
      const res = await api.get<QuranAyahDetail>(`/api/quran/surahs/${sura}/ayahs/${ayah}?tafsirs=none&translations=none&words=false`)
      return res.arabic ?? ''
    } catch {
      return ''
    }
  }, [])

  const selectedBookmarked = selectedAyah
    ? ayahBookmarks.some(b => b.surahNumber === selectedAyah.sura && b.ayahNumber === selectedAyah.ayah)
    : false

  async function handleBookmarkAyah() {
    if (!selectedAyah || actionBusy) return
    const { sura, ayah } = selectedAyah
    setActionBusy(true)
    const arabic = selectedBookmarked ? '' : await fetchArabic(sura, ayah)
    toggleBookmark({ surahNumber: sura, ayahNumber: ayah, surahName: SURA_NAMES[sura - 1], arabic })
    setActionBusy(false)
  }

  // ── Tilawat playback engine ─────────────────────────────────────────────────
  const getAudioUrls = useCallback(async (sura: number): Promise<string[]> => {
    const reciterId = selectedReciter || DEFAULT_RECITER
    const cacheKey = `${reciterId}:${sura}`
    // Presigned URLs expire after 5 min — reuse for 4
    if (audioUrlCache.current?.key === cacheKey && Date.now() - audioUrlCache.current.at < 4 * 60_000) {
      return audioUrlCache.current.urls
    }
    const res = await api.post<SuraAudioUrls>('/api/quran/sura-audio-urls', { reciterId, sura })
    audioUrlCache.current = { key: cacheKey, urls: res.urls, at: Date.now() }
    return res.urls
  }, [selectedReciter])

  const playAyah = useCallback(async (sura: number, ayah: number) => {
    setActiveAyah({ sura, ayah })
    setAudioError(false)
    // Follow playback: turn the page if this ayah isn't on the one currently shown
    const target = ayahFirstPage.get(`${sura}:${ayah}`)
    if (target !== undefined && target !== page) goTo(target)

    setAudioLoading(true)
    try {
      const urls = await getAudioUrls(sura)
      const url = urls[ayah - 1]
      if (!url || !audioRef.current) throw new Error('audio url missing')
      audioRef.current.pause()
      audioRef.current.src = url
      await audioRef.current.play()
    } catch {
      setAudioError(true)
      setIsPlaying(false)
    } finally {
      setAudioLoading(false)
    }
  }, [ayahFirstPage, page, goTo, getAudioUrls])

  const handleEnded = useCallback(() => {
    if (!activeAyah || !activeRange) return
    const next = activeAyah.ayah + 1
    if (next <= activeRange.end) {
      playAyah(activeRange.sura, next)
      return
    }
    if (activeRange.repeatsLeft > 1) {
      setActiveRange(r => r ? { ...r, repeatsLeft: r.repeatsLeft - 1 } : null)
      playAyah(activeRange.sura, activeRange.start)
      return
    }
    setActiveRange(null)
    setIsPlaying(false)
    setActiveAyah(null)
  }, [activeAyah, activeRange, playAyah])

  const playSingleAyah = useCallback((sura: number, ayah: number) => {
    setActiveRange({ sura, start: ayah, end: ayah, repeatsLeft: 1 })
    playAyah(sura, ayah)
  }, [playAyah])

  function handleMenuPlay() {
    if (!selectedAyah) return
    const { sura, ayah } = selectedAyah
    setSelectedAyah(null) // dismiss the tap menu — the highlight continues via activeAyah
    playSingleAyah(sura, ayah)
  }

  function startRangePlayback() {
    const maxAyah = AYAH_COUNTS[tilawatSura - 1]
    const start = fullSurah ? 1 : Math.max(1, Math.min(rangeStart, rangeEnd))
    const end = fullSurah ? maxAyah : Math.min(maxAyah, Math.max(rangeStart, rangeEnd))
    const repeats = Math.max(1, repeatCount)
    setActiveRange({ sura: tilawatSura, start, end, repeatsLeft: repeats })
    setTilawatOpen(false)
    playAyah(tilawatSura, start)
  }

  function stopPlayback() {
    audioRef.current?.pause()
    setActiveRange(null)
    setActiveAyah(null)
  }

  function togglePlayback() {
    if (!audioRef.current || !activeAyah) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play().catch(() => setAudioError(true))
  }

  function skipBack() {
    if (!activeAyah) return
    playAyah(activeAyah.sura, Math.max(1, activeAyah.ayah - 1))
  }

  function skipForward() {
    if (!activeAyah) return
    const maxAyah = AYAH_COUNTS[activeAyah.sura - 1]
    if (activeAyah.ayah < maxAyah) playAyah(activeAyah.sura, activeAyah.ayah + 1)
  }

  function openTilawatPopup() {
    const sura = boxesByPage.get(rightPage)?.[0]?.sura_number ?? 1
    setTilawatSura(sura)
    setRangeStart(1)
    setRangeEnd(AYAH_COUNTS[sura - 1])
    setTilawatOpen(true)
  }

  async function handleCopyAyah() {
    if (!selectedAyah || actionBusy) return
    setActionBusy(true)
    const arabic = await fetchArabic(selectedAyah.sura, selectedAyah.ayah)
    setActionBusy(false)
    if (!arabic) return
    await navigator.clipboard.writeText(arabic)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setSelectedAyah(null)
    }, 900)
  }

  async function handleShareAyah() {
    if (!selectedAyah || actionBusy) return
    const { sura, ayah } = selectedAyah
    setActionBusy(true)
    const arabic = await fetchArabic(sura, ayah)
    setActionBusy(false)
    const text = arabic || `সূরা ${SURA_NAMES[sura - 1]}, আয়াত ${bn(ayah)}`
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text)
    }
    setSelectedAyah(null)
  }

  // ── Page bookmark — bookmarks the spread's primary (right) page ────────────
  const currentPageBookmarked = pageBookmarks.some(b => b.page === rightPage)

  function handleTogglePageBookmark() {
    const cs = boxesByPage.get(rightPage)?.[0]?.sura_number ?? 1
    togglePageBookmark({ editionId: edition.id, page: rightPage, sura: cs, para: currentPara })
    setPageBookmarks(getPageBookmarks(edition.id))
  }

  // ── Page input ─────────────────────────────────────────────────────────────
  function startEditingPage() {
    setPageInput(String(page))
    setEditingPage(true)
    setTimeout(() => pageInputRef.current?.select(), 50)
  }

  function commitPageInput() {
    const n = parseInt(pageInput, 10)
    if (!isNaN(n)) goTo(n)
    setEditingPage(false)
  }

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomIn  = () => setScale(s => Math.min(parseFloat((s + 0.25).toFixed(2)), 3))
  const zoomOut = () => setScale(s => Math.max(parseFloat((s - 0.25).toFixed(2)), 0.75))

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const rightPageUrl = `${edition.pagesBaseUrl}/qm${rightPage}.${edition.ext}`
  const leftPageUrl = leftPage !== null ? `${edition.pagesBaseUrl}/qm${leftPage}.${edition.ext}` : null
  const rightPageBoxes = boxesByPage.get(rightPage) ?? []
  const leftPageBoxes = leftPage !== null ? (boxesByPage.get(leftPage) ?? []) : []
  const currentSura = rightPageBoxes[0]?.sura_number

  function boxesFor(pageBoxes: AyahBox[], target: { sura: number; ayah: number } | null) {
    return target ? pageBoxes.filter(b => b.sura_number === target.sura && b.ayah_number === target.ayah) : []
  }

  const rightSelectedBoxes = boxesFor(rightPageBoxes, selectedAyah)
  const leftSelectedBoxes = boxesFor(leftPageBoxes, selectedAyah)
  const rightPlayingBoxes = boxesFor(rightPageBoxes, activeAyah)
  const leftPlayingBoxes = boxesFor(leftPageBoxes, activeAyah)
  const sameAyahSelectedAndPlaying = !!(selectedAyah && activeAyah
    && selectedAyah.sura === activeAyah.sura && selectedAyah.ayah === activeAyah.ayah)
  const rightHighlightBoxes = sameAyahSelectedAndPlaying ? rightSelectedBoxes : [...rightSelectedBoxes, ...rightPlayingBoxes]
  const leftHighlightBoxes = sameAyahSelectedAndPlaying ? leftSelectedBoxes : [...leftSelectedBoxes, ...leftPlayingBoxes]

  // Ayah menu anchor: just above the top-most selected box, in rendered coordinates
  let menuTop: number | null = null
  let menuLeftPx: number | null = null
  if (selectedAyah && imgBounds) {
    const onRight = rightSelectedBoxes.length > 0
    const boxes = onRight ? rightSelectedBoxes : leftSelectedBoxes
    if (boxes.length > 0) {
      const half = imgBounds.showSpread ? imgBounds.w / 2 : imgBounds.w
      const faceX = imgBounds.showSpread && onRight ? imgBounds.x + imgBounds.w / 2 : imgBounds.x
      const minY = Math.min(...boxes.map(b => b.min_y))
      const fy = minY / edition.height
      const rendered = imgBounds.y + imgBounds.h / 2 + (fy - 0.5) * imgBounds.h * scale
      menuTop = Math.min(Math.max(110, rendered - 10), containerSize.h - 16)
      menuLeftPx = faceX + half / 2
    }
  }

  const selectedIsPlaying = sameAyahSelectedAndPlaying

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full overflow-hidden select-none bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-950"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* ── Page image(s) + highlight ── */}
      {imgBounds && (
        <div
          className="absolute transition-transform duration-200"
          style={{
            left: imgBounds.x,
            top: imgBounds.y,
            width: imgBounds.w,
            height: imgBounds.h,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {imgBounds.showSpread && leftPage !== null && leftPageUrl ? (
            <div className="flex w-full h-full">
              <PageFace
                className="w-1/2 h-full order-1"
                pageNum={leftPage}
                url={leftPageUrl}
                highlightBoxes={leftHighlightBoxes}
                editionWidth={edition.width}
                editionHeight={edition.height}
                onClick={e => handleAyahClick(e, leftPageBoxes)}
              />
              <PageFace
                className="w-1/2 h-full order-2"
                pageNum={rightPage}
                url={rightPageUrl}
                highlightBoxes={rightHighlightBoxes}
                editionWidth={edition.width}
                editionHeight={edition.height}
                onClick={e => handleAyahClick(e, rightPageBoxes)}
              />
            </div>
          ) : (
            <PageFace
              className="w-full h-full"
              pageNum={rightPage}
              url={rightPageUrl}
              highlightBoxes={rightHighlightBoxes}
              editionWidth={edition.width}
              editionHeight={edition.height}
              onClick={e => handleAyahClick(e, rightPageBoxes)}
            />
          )}
        </div>
      )}

      {/* ── Top toolbar ── */}
      <div className={cn(
        'absolute top-0 inset-x-0 z-30 flex items-center gap-3 px-3 py-2.5',
        'bg-background border-b border-border',
        'transition-all duration-300',
        barsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none -translate-y-2'
      )}>
        <button
          onClick={() => router.push('/quran')}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button onClick={toggleDrawer} className="flex-1 min-w-0 flex items-center gap-1 text-left">
          <div className="min-w-0">
            <p className="text-foreground font-semibold text-sm truncate">{edition.title}</p>
            {currentSura && (
              <p className="text-muted-foreground text-xs truncate">{SURA_NAMES[currentSura - 1]}</p>
            )}
          </div>
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', drawerOpen && 'rotate-180')} />
        </button>

        {/* Tilawat (recitation) */}
        <button
          onClick={openTilawatPopup}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Play className="w-3.5 h-3.5" />
          তিলাওয়াত শুনুন
        </button>

        {/* Zoom */}
        <button
          onClick={zoomOut}
          disabled={scale <= 0.75}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4.5 h-4.5" />
        </button>
        <span className="text-muted-foreground text-xs w-9 text-center tabular-nums">
          {bn(Math.round(scale * 100))}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= 3}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4.5 h-4.5" />
        </button>

        {/* Single-page / two-page spread toggle */}
        <button
          onClick={() => setSpreadMode(v => !v)}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
            spreadMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          title={spreadMode ? 'একক পাতা দেখুন' : 'দুই পাতা দেখুন'}
        >
          <BookOpen className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* ── Bottom bars — nav pill + tilawat audio pill, side by side, centered as one group ── */}
      <div className={cn(
        'absolute bottom-4 inset-x-0 z-30 flex items-center justify-center flex-wrap gap-3 px-3',
        'transition-all duration-300',
        barsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-2'
      )}>
        {/* Tilawat audio pill — visible while a recitation session is active */}
        {activeAyah && (
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-background/95 backdrop-blur-md border border-border shadow-xl">
            <div className="min-w-0 pl-2 pr-1">
              <p className="text-xs font-medium text-foreground truncate max-w-[9rem]">
                {SURA_NAMES[activeAyah.sura - 1]} · {bn(activeAyah.ayah)}
              </p>
              {audioError && <p className="text-[10px] text-destructive">অডিও পাওয়া যায়নি</p>}
            </div>

            <button
              onClick={openTilawatPopup}
              className={cn('p-1.5 rounded-full transition-colors', activeRange ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              title="আয়াত রেঞ্জ ও পুনরাবৃত্তি"
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              onClick={skipForward}
              disabled={activeAyah.ayah >= AYAH_COUNTS[activeAyah.sura - 1]}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayback}
              disabled={audioLoading}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={skipBack}
              disabled={activeAyah.ayah <= 1}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={stopPlayback}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page nav pill — RTL: next on the left, prev on the right */}
        <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-full bg-background/95 backdrop-blur-md border border-border shadow-xl">
          <button
            onClick={next}
            disabled={page >= edition.totalPages}
            className="flex items-center gap-1 pl-3 pr-3.5 py-2 rounded-full text-foreground hover:bg-muted disabled:opacity-30 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            পরে
          </button>

          <div className="w-px h-5 bg-border" />

          {/* Page indicator + page bookmark */}
          <button onClick={startEditingPage} className="px-2">
            {editingPage ? (
              <input
                ref={pageInputRef}
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onBlur={commitPageInput}
                onKeyDown={e => { if (e.key === 'Enter') commitPageInput() }}
                className="w-20 text-center text-foreground bg-muted border border-border rounded-lg px-2 py-1 text-sm tabular-nums outline-none focus:border-primary"
                type="number"
                min={1}
                max={edition.totalPages}
              />
            ) : (
              <span className="text-muted-foreground text-sm tabular-nums hover:text-foreground transition-colors">
                <span className="font-semibold text-foreground">
                  {leftPage !== null ? `${bn(rightPage)}–${bn(leftPage)}` : bn(rightPage)}
                </span>
                <span className="mx-1">/</span>
                {bn(edition.totalPages)}
              </span>
            )}
          </button>
          <button
            onClick={handleTogglePageBookmark}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
              currentPageBookmarked ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="পৃষ্ঠা বুকমার্ক"
          >
            <Star className={cn('w-4 h-4', currentPageBookmarked && 'fill-current')} />
          </button>

          <div className="w-px h-5 bg-border" />

          <button
            onClick={prev}
            disabled={page <= 1}
            className="flex items-center gap-1 pl-3.5 pr-3 py-2 rounded-full text-foreground hover:bg-muted disabled:opacity-30 transition-colors text-sm font-medium"
          >
            আগে
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Exit fullscreen — floating, bottom-right, visible only while bars are hidden ── */}
      {!barsVisible && (
        <button
          onClick={() => setBarsVisible(true)}
          className="absolute bottom-4 right-4 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-background/95 backdrop-blur-md border border-border shadow-xl text-foreground hover:bg-muted transition-colors"
          title="ফুলস্ক্রিন থেকে বের হন"
        >
          <Minimize className="w-4.5 h-4.5" />
        </button>
      )}

      {/* ── Ayah menu — centered, floating just above the selected ayah ── */}
      {selectedAyah && menuTop !== null && (
        <div
          className="absolute z-40"
          style={{ top: menuTop, left: menuLeftPx ?? '50%', transform: 'translate(-50%, -100%)' }}
        >
          <div className="flex items-center gap-0.5 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-xl px-1.5 py-1">
            <span className="px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap tabular-nums">
              {bn(selectedAyah.sura)}:{bn(selectedAyah.ayah)}
            </span>

            <button
              onClick={handleBookmarkAyah}
              disabled={actionBusy}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl transition-colors disabled:opacity-50',
                selectedBookmarked ? 'text-amber-500' : 'text-foreground hover:bg-muted'
              )}
              title="বুকমার্ক"
            >
              <Star className={cn('w-4.5 h-4.5', selectedBookmarked && 'fill-current')} />
            </button>

            <button
              onClick={handleMenuPlay}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-foreground hover:bg-muted transition-colors"
              title="আয়াতটি শুনুন"
            >
              {selectedIsPlaying ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={handleCopyAyah}
              disabled={actionBusy}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl transition-colors disabled:opacity-50',
                copied ? 'text-primary' : 'text-foreground hover:bg-muted'
              )}
              title="কপি করুন"
            >
              {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={handleShareAyah}
              disabled={actionBusy}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="শেয়ার করুন"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => { setBarsVisible(false); setSelectedAyah(null); setDrawerOpen(false) }}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-foreground hover:bg-muted transition-colors"
              title="ফুলস্ক্রিন"
            >
              <Maximize className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation drawer (left, like the text reader) — sits below the top bar, never covers it ── */}
      <div
        className={cn(
          'absolute bottom-0 left-0 z-50 w-80 max-w-[85vw] flex flex-col bg-background border-r border-border shadow-2xl',
          'transition-transform duration-300',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ top: TOP_BAR_SAFE }}
      >
        {/* Tabs */}
        <div className="flex items-center border-b border-border shrink-0">
          {DRAWER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setDrawerTab(tab.id)}
              className={cn(
                'flex-1 py-3 text-xs font-semibold transition-colors',
                drawerTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {boxesLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm">আয়াত ডেটা লোড হচ্ছে…</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* ── সূরা tab: surah list + ayah numbers ── */}
            {drawerTab === 'surah' && (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-[3] flex flex-col overflow-hidden border-r border-border">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">সূরা</p>
                  <div className="flex-1 overflow-y-auto">
                    {SURA_NAMES.map((name, i) => {
                      const suraNum = i + 1
                      const isSelected = navSurah === suraNum
                      return (
                        <button
                          key={suraNum}
                          onClick={() => setNavSurah(suraNum)}
                          disabled={!suraFirstPage.has(suraNum)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted border-b border-border/40',
                            'disabled:opacity-40',
                            isSelected && 'bg-primary/10'
                          )}
                        >
                          <span className={cn('text-sm truncate', isSelected ? 'font-bold text-primary' : 'text-foreground')}>
                            {bn(suraNum)}. {name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex-[2] flex flex-col overflow-hidden">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">আয়াত</p>
                  <div className="flex-1 overflow-y-auto">
                    {Array.from({ length: AYAH_COUNTS[navSurah - 1] }, (_, k) => k + 1).map(n => {
                      const isCurrent = selectedAyah?.sura === navSurah && selectedAyah?.ayah === n
                      const hasPage = ayahFirstPage.has(`${navSurah}:${n}`)
                      return (
                        <button
                          key={n}
                          onClick={() => goToAyah(navSurah, n)}
                          disabled={!hasPage}
                          className={cn(
                            'w-full py-2.5 text-sm text-center transition-colors hover:bg-muted border-b border-border/40 disabled:opacity-40',
                            isCurrent ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'
                          )}
                        >
                          {bn(n)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── পারা tab: para list + page numbers within the para ── */}
            {drawerTab === 'juz' && (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-[3] flex flex-col overflow-hidden border-r border-border">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">পারা</p>
                  <div className="flex-1 overflow-y-auto">
                    {PARA_NAMES.map((name, i) => {
                      const paraNum = i + 1
                      const isSelected = navPara === paraNum
                      return (
                        <button
                          key={paraNum}
                          onClick={() => setNavPara(paraNum)}
                          disabled={!paraPageRanges.has(paraNum)}
                          className={cn(
                            'w-full px-3 py-2.5 text-left transition-colors hover:bg-muted border-b border-border/40 disabled:opacity-40',
                            isSelected && 'bg-primary/10'
                          )}
                        >
                          <p className={cn('text-sm', isSelected ? 'font-bold text-primary' : 'text-foreground')}>পারা {bn(paraNum)}</p>
                          <p className={cn('text-xs truncate', isSelected ? 'text-primary/80' : 'text-muted-foreground')}>{name}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex-[2] flex flex-col overflow-hidden">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">পাতা</p>
                  <div className="flex-1 overflow-y-auto">
                    {(paraPageRanges.get(navPara) ?? []).map((actualPage, idx) => {
                      const isCurrent = actualPage === rightPage || (leftPage !== null && actualPage === leftPage)
                      return (
                        <button
                          key={actualPage}
                          onClick={() => goTo(actualPage)}
                          className={cn(
                            'w-full py-2.5 text-sm text-center transition-colors hover:bg-muted border-b border-border/40',
                            isCurrent ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'
                          )}
                        >
                          {bn(idx + 1)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── বুকমার্ক tab: ayah + page bookmarks ── */}
            {drawerTab === 'bookmarks' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex border-b border-border shrink-0">
                  {([['ayah', 'আয়াত'], ['page', 'পৃষ্ঠা']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setBookmarkTab(id)}
                      className={cn(
                        'flex-1 py-2.5 text-xs font-semibold transition-colors',
                        bookmarkTab === id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {bookmarkTab === 'ayah' && (
                    ayahBookmarks.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-16 px-4">কোনো আয়াত বুকমার্ক করা নেই।</p>
                    ) : (
                      ayahBookmarks.map((b, i) => {
                        const pg = ayahFirstPage.get(`${b.surahNumber}:${b.ayahNumber}`)
                        const para = paraOfSuraAyah(b.surahNumber, b.ayahNumber)
                        return (
                          <div key={`${b.surahNumber}:${b.ayahNumber}`} className="flex items-center border-b border-border/40">
                            <button
                              onClick={() => { if (pg !== undefined) goToAyah(b.surahNumber, b.ayahNumber) }}
                              disabled={pg === undefined}
                              className="flex-1 min-w-0 px-3 py-2.5 text-left hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <p className="text-sm font-medium text-foreground truncate">
                                {bn(i + 1)}. {b.surahName}, আয়াত {bn(b.ayahNumber)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                পারা {bn(para)}{pg !== undefined ? `, পৃষ্ঠা ${bn(pg)}` : ''}
                              </p>
                            </button>
                            <button
                              onClick={() => removeBookmark(b.surahNumber, b.ayahNumber)}
                              className="shrink-0 p-2.5 text-muted-foreground hover:text-destructive transition-colors"
                              title="মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })
                    )
                  )}

                  {bookmarkTab === 'page' && (
                    pageBookmarks.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-16 px-4">কোনো পৃষ্ঠা বুকমার্ক করা নেই।</p>
                    ) : (
                      pageBookmarks.map((b, i) => (
                        <div key={b.page} className="flex items-center border-b border-border/40">
                          <button
                            onClick={() => goTo(b.page)}
                            className="flex-1 min-w-0 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                          >
                            <p className="text-sm font-medium text-foreground truncate">
                              {bn(i + 1)}. {SURA_NAMES[b.sura - 1] ?? ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {b.para ? `পারা ${bn(b.para)}, ` : ''}পৃষ্ঠা {bn(b.page)}
                            </p>
                          </button>
                          <button
                            onClick={() => { removePageBookmark(edition.id, b.page); setPageBookmarks(getPageBookmarks(edition.id)) }}
                            className="shrink-0 p-2.5 text-muted-foreground hover:text-destructive transition-colors"
                            title="মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Tilawat popup — surah/reciter/range picker, same UI as the text reader ── */}
      {tilawatOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={() => setTilawatOpen(false)} />

          <div className="relative w-full sm:max-w-md sm:mx-4 bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border">
              <p className="text-sm font-bold text-foreground">তিলাওয়াত শুনুন</p>
              <button
                onClick={() => setTilawatOpen(false)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-sm font-semibold text-foreground">সূরা:</p>
                <select
                  value={tilawatSura}
                  onChange={e => {
                    const n = Number(e.target.value)
                    setTilawatSura(n)
                    setRangeStart(1)
                    setRangeEnd(AYAH_COUNTS[n - 1])
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SURA_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{bn(i + 1)}. {name}</option>
                  ))}
                </select>
              </div>

              {reciters.length > 0 && (
                <div className="flex items-center gap-3">
                  <p className="w-24 shrink-0 text-sm font-semibold text-foreground">ক্বারী:</p>
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
                <p className="w-24 shrink-0 text-sm font-semibold text-foreground">শুরু আয়াত:</p>
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
                  {Array.from({ length: AYAH_COUNTS[tilawatSura - 1] }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{bn(n)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-sm font-semibold text-foreground">শেষ আয়াত:</p>
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
                  {Array.from({ length: AYAH_COUNTS[tilawatSura - 1] }, (_, i) => i + 1).map(n => (
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
                <span className="text-sm font-medium text-foreground">সম্পূর্ণ সূরা</span>
              </label>

              <div className="flex items-center justify-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/40">
                <span className="text-sm font-medium text-foreground">আয়াতের পুনরাবৃত্তি</span>
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
                অডিও শুনুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it
export function MushafReader(props: Props) {
  return (
    <Suspense>
      <MushafReaderInner {...props} />
    </Suspense>
  )
}
